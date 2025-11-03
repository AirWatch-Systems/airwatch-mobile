import { useState, useEffect, useCallback } from 'react';
import { AutoAuthService } from '../services/autoAuth';

export function useAutoAuth() {
  const [isAutoLoginEnabled, setIsAutoLoginEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const autoAuthService = AutoAuthService.getInstance();

  const checkAutoLoginStatus = useCallback(async () => {
    try {
      const enabled = await autoAuthService.isAutoLoginEnabled();
      setIsAutoLoginEnabled(enabled);
    } catch (error) {
      console.error('Error checking auto-login status:', error);
      setIsAutoLoginEnabled(false);
    } finally {
      setLoading(false);
    }
  }, [autoAuthService]);

  const enableAutoLogin = useCallback(async (email: string, password: string) => {
    try {
      await autoAuthService.enableAutoLogin(email, password);
      setIsAutoLoginEnabled(true);
      return true;
    } catch (error) {
      console.error('Error enabling auto-login:', error);
      return false;
    }
  }, [autoAuthService]);

  const disableAutoLogin = useCallback(async () => {
    try {
      await autoAuthService.disableAutoLogin();
      setIsAutoLoginEnabled(false);
      return true;
    } catch (error) {
      console.error('Error disabling auto-login:', error);
      return false;
    }
  }, [autoAuthService]);

  const attemptAutoLogin = useCallback(async () => {
    try {
      return await autoAuthService.attemptAutoLogin();
    } catch (error) {
      console.error('Auto-login attempt failed:', error);
      return false;
    }
  }, [autoAuthService]);

  useEffect(() => {
    checkAutoLoginStatus();
  }, [checkAutoLoginStatus]);

  return {
    isAutoLoginEnabled,
    loading,
    enableAutoLogin,
    disableAutoLogin,
    attemptAutoLogin,
    checkAutoLoginStatus
  };
}