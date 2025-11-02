import { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthService } from '../services/auth';
import { AuthState } from '../types';
import { onUnauthorized } from '../services/api';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    token: null,
    expiresAt: null
  });
  const [loading, setLoading] = useState(true);

  const authService = useMemo(() => AuthService.getInstance(), []);

  const initializeAuth = useCallback(async () => {
    try {
      const isAuthenticated = await authService.loadStoredAuth();
      if (isAuthenticated) {
        setAuthState(authService.getAuthState());
      } else {
        setAuthState({ isAuthenticated: false, token: null, expiresAt: null });
      }
    } catch {
      setAuthState({ isAuthenticated: false, token: null, expiresAt: null });
    } finally {
      setLoading(false);
    }
  }, [authService]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
      const newState = authService.getAuthState();
      setAuthState(newState);
      return newState;
    } catch {
      const fallbackState = { isAuthenticated: false, token: null, expiresAt: null };
      setAuthState(fallbackState);
      return fallbackState;
    }
  }, [authService]);

  const refreshAuthState = useCallback(() => {
    try {
      setAuthState(authService.getAuthState());
    } catch {
      setAuthState({ isAuthenticated: false, token: null, expiresAt: null });
    }
  }, [authService]);

  const isTokenExpired = useMemo(() => {
    try {
      return authService.isTokenExpired();
    } catch {
      return true;
    }
  }, [authService]);

  useEffect(() => {
    initializeAuth();

    const unsubscribe = onUnauthorized(() => {
      logout().catch();
    });

    return () => {
      unsubscribe();
    };
  }, [initializeAuth, logout]);

  return {
    ...authState,
    loading,
    logout,
    refreshAuthState,
    isTokenExpired
  };
}