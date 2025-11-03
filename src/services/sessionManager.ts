import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TEMP_SESSION_KEY = 'temp_2fa_session';
const TEMP_SESSION_TTL_MS = 15 * 60 * 1000; // 15 minutes

// Storage abstraction for web/mobile
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return sessionStorage.getItem(key); // Use sessionStorage para dados temporários
    }
    return AsyncStorage.getItem(key);
  },
  
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      sessionStorage.setItem(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  },
  
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      sessionStorage.removeItem(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  }
};

export interface TempSession {
  sessionId: string;
  email: string;
  timestamp: number;
  expiresAt: number;
  codeGeneratedAt: number;
}

export class SessionManager {
  private static instance: SessionManager;

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  async storeTempSession(sessionId: string, email: string): Promise<void> {
    const now = Date.now();
    const session: TempSession = {
      sessionId,
      email,
      timestamp: now,
      expiresAt: now + TEMP_SESSION_TTL_MS,
      codeGeneratedAt: now
    };

    await storage.setItem(TEMP_SESSION_KEY, JSON.stringify(session));
  }

  async updateCodeTimestamp(): Promise<void> {
    const session = await this.getTempSession();
    if (session) {
      session.codeGeneratedAt = Date.now();
      await storage.setItem(TEMP_SESSION_KEY, JSON.stringify(session));
    }
  }

  async getTempSession(): Promise<TempSession | null> {
    try {
      const sessionStr = await storage.getItem(TEMP_SESSION_KEY);
      if (!sessionStr) return null;

      const session: TempSession = JSON.parse(sessionStr);
      
      // Verificar se a sessão expirou
      if (Date.now() > session.expiresAt) {
        await this.clearTempSession();
        return null;
      }

      return session;
    } catch {
      return null;
    }
  }

  async clearTempSession(): Promise<void> {
    await storage.removeItem(TEMP_SESSION_KEY);
  }

  async isValidTempSession(): Promise<boolean> {
    const session = await this.getTempSession();
    return session !== null;
  }
}