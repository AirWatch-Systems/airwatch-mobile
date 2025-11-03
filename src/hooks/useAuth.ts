import { useState, useEffect, useCallback, useMemo } from 'react';
import { router } from 'expo-router';
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
      router.replace('/login');
      return newState;
    } catch {
      const fallbackState = { isAuthenticated: false, token: null, expiresAt: null };
      setAuthState(fallbackState);
      router.replace('/login');
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

  const saveCurrentRoute = useCallback(async (route: string) => {
    await authService.saveLastRoute(route);
  }, [authService]);

  const getLastRoute = useCallback(async () => {
    return authService.getLastRoute();
  }, [authService]);

  const clearLastRoute = useCallback(async () => {
    await authService.clearLastRoute();
  }, [authService]);

  useEffect(() => {
    initializeAuth();

    const unsubscribe = onUnauthorized(async () => {
      // Salvar rota atual antes do logout por token expirado
      const currentPath = window?.location?.pathname || '/';
      if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
        await authService.saveLastRoute(currentPath);
      }
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
    saveCurrentRoute,
    getLastRoute,
    clearLastRoute
  };
}