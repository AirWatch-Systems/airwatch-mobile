import { useCallback, useEffect, useRef, useState } from "react";
import {
  ApiError,
  post,
  setAuthToken,
  onUnauthorized,
  offUnauthorized,
  toApiError,
} from "../services/api";
import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  Verify2FaRequest,
  Verify2FaResponse,
} from "./types";

/**
 * useAuth
 * - RF01: register
 * - RF02: login with 2FA and JWT
 * - Keeps auth state in memory (no local storage)
 */
export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);

  const tokenExpiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTokenTimer = useCallback(() => {
    if (tokenExpiryTimerRef.current) {
      clearTimeout(tokenExpiryTimerRef.current);
      tokenExpiryTimerRef.current = null;
    }
  }, []);

  const logout = useCallback(() => {
    clearTokenTimer();
    setToken(null);
    setAuthToken(null);
    setPendingSessionId(null);
    setError(null);
  }, [clearTokenTimer]);

  useEffect(() => {
    const unsub = onUnauthorized(() => {
      // force logout on 401/403 from API
      logout();
    });
    return () => {
      offUnauthorized(unsub);
    };
  }, [logout]);

  const register = useCallback(
    async (data: RegisterRequest) => {
      setIsAuthenticating(true);
      setError(null);
      try {
        const res = await post<RegisterResponse, RegisterRequest>("/api/Auth/register", data);
        return res;
      } catch (e) {
        const err = toApiError(e);
        setError(err);
        return null; // Indica falha sem lançar erro
      } finally {
        setIsAuthenticating(false);
      }
    },
    []
  );

  const loginStart = useCallback(
    async (data: LoginRequest) => {
      setIsAuthenticating(true);
      setError(null);
      setPendingSessionId(null);
      try {
        const res = await post<LoginResponse, LoginRequest>("/api/Auth/login", data);
        if (res.requires2FA && res.sessionId) {
          setPendingSessionId(res.sessionId);
        }
        return res;
      } catch (e) {
        const err = toApiError(e);
        setError(err);
        return null; // Indica falha sem lançar erro
      } finally {
        setIsAuthenticating(false);
      }
    },
    []
  );

  const verify2fa = useCallback(
    async (sessionId: string, code: string) => {
      setIsAuthenticating(true);
      setError(null);
      try {
        const res = await post<Verify2FaResponse, Verify2FaRequest>("/api/Auth/verify-2fa", {
          sessionId,
          token: code,
        });
        setToken(res.token);
        setAuthToken(res.token);
        setPendingSessionId(null);

        // Schedule token invalidation after expiresIn seconds
        clearTokenTimer();
        tokenExpiryTimerRef.current = setTimeout(() => {
          logout();
        }, Math.max(1, res.expiresIn) * 1000);

        return res.token;
      } catch (e) {
        const err = toApiError(e);
        setError({
          ...err,
          message: "Falha na verificação 2FA. Verifique o código e tente novamente.",
        });
        return null; // Indica falha sem lançar erro
      } finally {
        setIsAuthenticating(false);
      }
    },
    [clearTokenTimer, logout]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // state
    token,
    isAuthenticated: Boolean(token),
    isAuthenticating,
    error,
    pendingSessionId,

    // actions
    register,
    loginStart,
    verify2fa,
    logout,
    clearError,
  };
}
