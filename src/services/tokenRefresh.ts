import { AuthService } from './auth';

let refreshPromise: Promise<boolean> | null = null;

export async function ensureValidToken(): Promise<boolean> {
  const authService = AuthService.getInstance();
  const authState = authService.getAuthState();
  
  if (!authState.isAuthenticated || !authState.expiresAt) {
    return false;
  }

  // Check if token expires in the next 5 minutes
  const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000);
  
  if (authState.expiresAt <= fiveMinutesFromNow) {
    // Token is expired or will expire soon
    if (refreshPromise) {
      return refreshPromise;
    }

    refreshPromise = performTokenRefresh();
    const result = await refreshPromise;
    refreshPromise = null;
    
    return result;
  }

  return true;
}

async function performTokenRefresh(): Promise<boolean> {
  try {
    const authService = AuthService.getInstance();
    
    // In a real app, you would call a refresh endpoint here
    // For this implementation, we'll just check if stored token is still valid
    const isValid = await authService.loadStoredAuth();
    
    if (!isValid) {
      // Token is invalid, user needs to login again
      await authService.logout();
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
}