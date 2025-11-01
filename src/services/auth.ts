import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { post, setAuthToken } from './api';
import { LoginRequest, LoginResponse, Verify2FaRequest, Verify2FaResponse, AuthState } from '../types';

const TOKEN_KEY = 'auth_token';
const EXPIRES_KEY = 'auth_expires';

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
    return response;
  }

  async verify2FA(sessionId: string, token: string): Promise<void> {
    const response = await post<Verify2FaResponse, Verify2FaRequest>('/api/auth/verify-2fa', {
      sessionId,
      token
    });

    const expiresAt = Date.now() + (response.expiresIn * 1000);
    
    await this.saveToken(response.token, expiresAt);
    this.updateAuthState(response.token, expiresAt);
  }

  private async saveToken(token: string, expiresAt: number): Promise<void> {
    await storage.setItem(TOKEN_KEY, token);
    await storage.setItem(EXPIRES_KEY, expiresAt.toString());
  }

  private updateAuthState(token: string, expiresAt: number): void {
    this.authState = {
      isAuthenticated: true,
      token,
      expiresAt
    };
    setAuthToken(token);
  }

  async loadStoredAuth(): Promise<boolean> {
    try {
      const token = await storage.getItem(TOKEN_KEY);
      const expiresAtStr = await storage.getItem(EXPIRES_KEY);
      
      if (!token || !expiresAtStr) {
        return false;
      }

      const expiresAt = parseInt(expiresAtStr, 10);
      
      if (Date.now() >= expiresAt) {
        await this.logout();
        return false;
      }

      this.updateAuthState(token, expiresAt);
      return true;
    } catch {
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      await storage.removeItem(TOKEN_KEY);
      await storage.removeItem(EXPIRES_KEY);
    } catch (error) {
      console.error('Error removing auth tokens:', error);
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

  isTokenExpired(): boolean {
    if (!this.authState.expiresAt) return true;
    return Date.now() >= this.authState.expiresAt;
  }
}