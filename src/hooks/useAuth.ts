import { useState, useEffect } from 'react';
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

  const authService = AuthService.getInstance();

  useEffect(() => {
    initializeAuth();
    
    // Listen for unauthorized responses to auto-logout
    const unsubscribe = onUnauthorized(() => {
      logout();
    });

    return unsubscribe;
  }, []);

  const initializeAuth = async () => {
    try {
      const isAuthenticated = await authService.loadStoredAuth();
      if (isAuthenticated) {
        setAuthState(authService.getAuthState());
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      const newState = authService.getAuthState();
      setAuthState(newState);
      // Force immediate update
      return newState;
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  const refreshAuthState = () => {
    setAuthState(authService.getAuthState());
  };

  return {
    ...authState,
    loading,
    logout,
    refreshAuthState,
    isTokenExpired: authService.isTokenExpired()
  };
}