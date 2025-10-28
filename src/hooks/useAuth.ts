import { useCallback, useEffect, useRef, useState } from "react";
import {
  ApiError,
  post,
  setAuthToken,
  onUnauthorized,
  offUnauthorized,
  toApiError,
} from "../services/api";
import {
  storage,
  getStoredAuth,
  isUserLoggedIn,
  clearStoredAuth,
  type StoredAuthData,
} from "./utils";
import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  Verify2FaRequest,
  Verify2FaResponse,
} from "./types";

/**
 * Custom hook for authentication management
 *
 * Features:
 * - RF01: User registration
 * - RF02: Login with 2FA and JWT token handling
 * - Persists authentication state in cross-platform storage
 * - Automatic token expiration handling
 * - API unauthorized response handling
 */
export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const tokenExpiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTokenTimer = useCallback(() => {
    if (tokenExpiryTimerRef.current) {
      clearTimeout(tokenExpiryTimerRef.current);
      tokenExpiryTimerRef.current = null;
    }
  }, []);

  const logout = useCallback(async () => {
    clearTokenTimer();
    setToken(null);
    setAuthToken(null);
    setPendingSessionId(null);
    setError(null);
    try {
      await clearStoredAuth();
    } catch (e) {
      console.warn("Failed to remove auth data from storage:", e);
    }
  }, [clearTokenTimer]);

  // Helper function to save token and schedule expiry
  const saveTokenAndScheduleExpiry = useCallback(
    async (token: string, expiresIn?: number) => {
      setToken(token);
      setAuthToken(token);

      // Calculate expiry timestamp
      const expiresAt = expiresIn ? Date.now() + expiresIn * 1000 : null;

      // Persist token and expiry in storage
      try {
        const authData: StoredAuthData = { token, expiresAt: expiresAt || 0 };
        await storage.setItem("auth_data", JSON.stringify(authData));
      } catch (e) {
        console.warn("Failed to save auth data to storage:", e);
      }

      // Schedule token invalidation after expiresIn seconds
      clearTokenTimer();
      if (expiresIn) {
        tokenExpiryTimerRef.current = setTimeout(() => {
          logout();
        }, Math.max(1, expiresIn) * 1000);
      }
    },
    [clearTokenTimer, logout]
  );

  useEffect(() => {
    let isMounted = true;

    const loadToken = async () => {
      try {
        const authData = await getStoredAuth();
        if (authData && isMounted) {
          const now = Date.now();

          // Check if token is expired
          if (authData.expiresAt && authData.expiresAt > now) {
            setToken(authData.token);
            setAuthToken(authData.token);

            // Schedule expiry timer
            const remainingTime = authData.expiresAt - now;
            tokenExpiryTimerRef.current = setTimeout(() => {
              logout();
            }, remainingTime);
          } else {
            // Token expired, remove from storage
            await clearStoredAuth();
          }
        }
      } catch (e) {
        console.warn("Failed to load auth data from storage:", e);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadToken();

    const unsub = onUnauthorized(() => {
      // Force logout on 401/403 from API
      logout();
    });

    return () => {
      isMounted = false;
      offUnauthorized(unsub);
    };
  }, [logout]);

  const register = useCallback(
    async (data: RegisterRequest): Promise<RegisterResponse | null> => {
      setIsAuthenticating(true);
      setError(null);
      try {
        const res = await post<RegisterResponse, RegisterRequest>("/api/Auth/register", data);
        return res;
      } catch (e) {
        const err = toApiError(e);
        setError(err);
        return null; // Indicates failure without throwing error
      } finally {
        setIsAuthenticating(false);
      }
    },
    []
  );

  const loginStart = useCallback(
    async (data: LoginRequest): Promise<LoginResponse | null> => {
      setIsAuthenticating(true);
      setError(null);
      setPendingSessionId(null);
      try {
        const res = await post<LoginResponse, LoginRequest>("/api/Auth/login", data);
        if (res.requires2FA && res.sessionId) {
          setPendingSessionId(res.sessionId);
        } else if (res.token) {
          // No 2FA required, save token directly
          await saveTokenAndScheduleExpiry(res.token, res.expiresIn);
          setPendingSessionId(null);
        }
        return res;
      } catch (e) {
        const err = toApiError(e);
        setError(err);
        return null; // Indicates failure without throwing error
      } finally {
        setIsAuthenticating(false);
      }
    },
    [saveTokenAndScheduleExpiry]
  );

  const verify2fa = useCallback(
    async (sessionId: string, code: string): Promise<string | null> => {
      setIsAuthenticating(true);
      setError(null);
      try {
        const res = await post<Verify2FaResponse, Verify2FaRequest>("/api/Auth/verify-2fa", {
          sessionId,
          token: code,
        });
        await saveTokenAndScheduleExpiry(res.token, res.expiresIn);
        setPendingSessionId(null);

        return res.token;
      } catch (e) {
        const err = toApiError(e);
        setError({
          ...err,
          message: "Failed 2FA verification. Please check the code and try again.",
        });
        return null; // Indicates failure without throwing error
      } finally {
        setIsAuthenticating(false);
      }
    },
    [saveTokenAndScheduleExpiry]
  );

  const checkAuth = useCallback(async (): Promise<boolean> => {
    return await isUserLoggedIn();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // state
    token,
    isAuthenticated: Boolean(token),
    isAuthenticating,
    isLoading,
    error,
    pendingSessionId,

    // actions
    register,
    loginStart,
    verify2fa,
    logout,
    checkAuth,
    clearError,
  };
}
