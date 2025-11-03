import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { post, setAuthToken } from './api';
import { LoginRequest, LoginResponse, Verify2FaRequest, Verify2FaResponse, AuthState } from '../types';

const TOKEN_KEY = 'auth_token';
const LAST_ROUTE_KEY = 'last_route';
const FIRST_LOGIN_KEY = 'first_login';

// Storage abstraction for web/mobile
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return AsyncStorage.getItem(key);
  },
  
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  },
  
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  }
};

export class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    isAuthenticated: false,
    token: null,
    expiresAt: null
  };

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await post<LoginResponse, LoginRequest>('/api/auth/login', {
      email,
      password
    });
    
    // Se não requer 2FA, salvar token e marcar como primeiro login
    if (!response.requires2Fa && response.token) {
      await this.saveToken(response.token);
      this.updateAuthState(response.token);
      await this.markFirstLogin();
    }
    
    return response;
  }

  async verify2FA(sessionId: string, token: string): Promise<void> {
    const response = await post<Verify2FaResponse, Verify2FaRequest>('/api/auth/verify-2fa', {
      sessionId,
      token
    });

    await this.saveToken(response.token);
    this.updateAuthState(response.token);
    await this.markFirstLogin();
  }

  async resend2FACode(sessionId: string): Promise<void> {
    await post('/api/auth/resend-2fa', { sessionId });
  }

  private async saveToken(token: string): Promise<void> {
    await storage.setItem(TOKEN_KEY, token);
  }



  private updateAuthState(token: string): void {
    this.authState = {
      isAuthenticated: true,
      token,
      expiresAt: null
    };
    setAuthToken(token);
  }

  async loadStoredAuth(): Promise<boolean> {
    try {
      const token = await storage.getItem(TOKEN_KEY);
      
      if (!token) {
        return false;
      }

      this.updateAuthState(token);
      return true;
    } catch {
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      await storage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error removing auth token:', error);
    }
    
    this.authState = {
      isAuthenticated: false,
      token: null,
      expiresAt: null
    };
    setAuthToken(null);
  }

  getAuthState(): AuthState {
    return { ...this.authState };
  }

  async saveLastRoute(route: string): Promise<void> {
    await storage.setItem(LAST_ROUTE_KEY, route);
  }

  async getLastRoute(): Promise<string | null> {
    return storage.getItem(LAST_ROUTE_KEY);
  }

  async clearLastRoute(): Promise<void> {
    await storage.removeItem(LAST_ROUTE_KEY);
  }

  async markFirstLogin(): Promise<void> {
    await storage.setItem(FIRST_LOGIN_KEY, 'true');
  }

  async isFirstLogin(): Promise<boolean> {
    const value = await storage.getItem(FIRST_LOGIN_KEY);
    return value === 'true';
  }

  async clearFirstLogin(): Promise<void> {
    await storage.removeItem(FIRST_LOGIN_KEY);
  }
}