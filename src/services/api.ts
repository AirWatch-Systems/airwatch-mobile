import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, isAxiosError } from "axios";
import { CONFIG } from "../../src/constants/config";

export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: unknown;
  traceId?: string;
  isNetworkError?: boolean;
  url?: string;
}

type UnauthorizedCallback = (error: ApiError) => void;

let currentToken: string | null = null;
const unauthorizedListeners = new Set<UnauthorizedCallback>();

/**
 * Configure the JWT token to be sent on every request via Authorization header.
 * Pass null/undefined to clear it.
 */
export function setAuthToken(token?: string | null) {
  currentToken = token ?? null;
}

/**
 * Returns the currently configured JWT token (if any).
 */
export function getAuthToken(): string | null {
  return currentToken;
}

/**
 * Subscribe to unauthorized (401/403) events to trigger logout/redirect flows.
 */
export function onUnauthorized(cb: UnauthorizedCallback) {
  unauthorizedListeners.add(cb);
  return () => unauthorizedListeners.delete(cb);
}

/**
 * Unsubscribe a previously registered unauthorized listener.
 */
export function offUnauthorized(cb: UnauthorizedCallback) {
  unauthorizedListeners.delete(cb);
}

/**
 * Shared Axios instance configured for this app.
 */
export const api: AxiosInstance = axios.create({
  baseURL: CONFIG.apiUrl,
  timeout: CONFIG.requestTimeoutMs,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
  // RN/Expo: withCredentials is not used by default; keep cookies off.
});

/**
 * Request interceptor: attaches Authorization header if a JWT is configured.
 */
api.interceptors.request.use(async (config) => {
  if (currentToken) {
    config.headers = config.headers ?? {};
    // Don't overwrite if explicitly set on a single call
    if (!("Authorization" in config.headers)) {
      (config.headers as Record<string, string>).Authorization = `Bearer ${currentToken}`;
    }
  }
  return config;
});

/**
 * Response interceptor: normalizes errors and broadcasts 401/403.
 */
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const normalized = toApiError(error);

    // Não fazer logout automático para erros de 2FA
    const is2FAEndpoint = error.config?.url?.includes('/auth/verify-2fa') || error.config?.url?.includes('/auth/resend-2fa');
    
    if ((normalized.status === 401 || normalized.status === 403) && !is2FAEndpoint) {
      // Notificar listeners para logout
      unauthorizedListeners.forEach((cb) => {
        try {
          cb(normalized);
        } catch (e) {
          if (__DEV__) console.warn("[api] Unauthorized listener threw:", e);
        }
      });
    }

    return Promise.reject(normalized);
  }
);

/**
 * Converts any Axios or unknown error into a normalized ApiError with localized message.
 */
export function toApiError(err: unknown): ApiError {
  if (isAxiosError(err)) {
    const ae = err as AxiosError<any>;
    const status = ae.response?.status;
    const url =
      (ae.config?.baseURL ?? "") +
      (ae.config?.url ?? "");
    const data = ae.response?.data;

    const serverMessage =
      (typeof data === "object" && data && "Message" in data && typeof data.Message === "string" && data.Message) ||
      (typeof data === "object" && data && "message" in data && typeof data.message === "string" && data.message) ||
      (typeof data === "object" && data && "error" in data && typeof data.error === "string" && data.error) ||
      (typeof data === "string" && data) ||
      undefined;

    const serverDetails =
      (typeof data === "object" && data && "details" in data && (data as any).details) || undefined;

    const traceId =
      (typeof data === "object" && data && "traceId" in data && typeof (data as any).traceId === "string" && (data as any).traceId) ||
      undefined;

    // Timeout / aborted request
    const timedOut = ae.code === "ECONNABORTED";

    // Network error (no response)
    const isNetworkError = !ae.response;

    const message = serverMessage || getContextualErrorMessage(url, status, serverMessage, timedOut, isNetworkError);

    const apiError: ApiError = new Error(message);
    apiError.status = status;
    apiError.code = ae.code;
    apiError.details = serverDetails ?? data;
    apiError.traceId = traceId;
    apiError.isNetworkError = isNetworkError;
    apiError.url = url;

    return apiError;
  }

  const fallback = new Error("Ocorreu um erro inesperado.") as ApiError;
  fallback.code = "UNEXPECTED";
  return fallback;
}

/**
 * Get contextual error message based on endpoint and status
 */
function getContextualErrorMessage(
  url: string,
  status?: number,
  serverMessage?: string,
  timedOut?: boolean,
  isNetworkError?: boolean
): string {
  if (serverMessage) return serverMessage;

  if (timedOut) return "Tempo de requisição esgotado.";
  if (isNetworkError) return "Verifique sua conexão com a internet.";

  // Mensagens específicas por endpoint
  if (url.includes('/auth/login')) {
    switch (status) {
      case 401:
      case 403:
      case 422:
        return "Email ou senha inválidos.";
      default:
        return defaultMessageForStatus(status);
    }
  }

  if (url.includes('/auth/verify-2fa')) {
    switch (status) {
      case 401:
      case 403:        
      case 422:      
      case 410:
        return "Código de verificação expirado.";
      default:
        return defaultMessageForStatus(status);
    }
  }

  if (url.includes('/auth/resend-2fa')) {
    switch (status) {
      case 401:
      case 403:
        return "Sessão expirada. Faça login novamente.";
      default:
        return defaultMessageForStatus(status);
    }
  }



  return defaultMessageForStatus(status);
}

/**
 * Heuristics for friendly localized messages based on HTTP status.
 */
function defaultMessageForStatus(status?: number): string {
  switch (status) {
    case 400:
      return "Requisição inválida.";
    case 401:
    case 403:
      return "Sessão expirada. Faça login novamente.";
    case 404:
      return "Recurso não encontrado.";
    case 408:
      return "Tempo de requisição esgotado.";
    case 409:
      return "Conflito ao processar a requisição.";
    case 422:
      return "Dados inválidos. Verifique os campos informados.";
    case 429:
      return "Muitas requisições. Tente novamente em instantes.";
    case 500:
    case 502:
    case 503:
    case 504:
      return "Serviço temporariamente indisponível.";
    default:
      return "Ocorreu um erro ao comunicar com o servidor.";
  }
}

/**
 * Helper typed GET request that unwraps data and throws ApiError on failures.
 */
export async function get<T = unknown>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const res = await api.get<T>(url, config);
  return res.data;
}

/**
 * Helper typed POST request that unwraps data and throws ApiError on failures.
 */
export async function post<TResponse = unknown, TBody = unknown>(
  url: string,
  body?: TBody,
  config?: AxiosRequestConfig
): Promise<TResponse> {
  const res = await api.post<TResponse>(url, body, config);
  return res.data;
}

/**
 * Helper typed PUT request that unwraps data and throws ApiError on failures.
 */
export async function put<TResponse = unknown, TBody = unknown>(
  url: string,
  body?: TBody,
  config?: AxiosRequestConfig
): Promise<TResponse> {
  const res = await api.put<TResponse>(url, body, config);
  return res.data;
}

/**
 * Helper typed PATCH request that unwraps data and throws ApiError on failures.
 */
export async function patch<TResponse = unknown, TBody = unknown>(
  url: string,
  body?: TBody,
  config?: AxiosRequestConfig
): Promise<TResponse> {
  const res = await api.patch<TResponse>(url, body, config);
  return res.data;
}

/**
 * Helper typed DELETE request that unwraps data and throws ApiError on failures.
 */
export async function del<TResponse = unknown>(
  url: string,
  config?: AxiosRequestConfig
): Promise<TResponse> {
  const res = await api.delete<TResponse>(url, config);
  return res.data;
}

/**
 * Type guard for ApiError.
 */
export function isApiError(e: unknown): e is ApiError {  
  return e instanceof Error && "message" in e;
}
