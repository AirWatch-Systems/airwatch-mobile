import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import type { ApiError } from "../services/api";

// Cross-platform storage utilities
export const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === "web") {
      return localStorage.getItem(key);
    }
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
      return Promise.resolve();
    }
    return AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === "web") {
      localStorage.removeItem(key);
      return Promise.resolve();
    }
    return AsyncStorage.removeItem(key);
  },
};

// Auth data structure for storage
export interface StoredAuthData {
  token: string;
  expiresAt: number; // timestamp in milliseconds
}

/**
 * Retrieves stored authentication data from storage
 */
export async function getStoredAuth(): Promise<StoredAuthData | null> {
  const storedData = await storage.getItem("auth_data");
  if (storedData) {
    const authData: StoredAuthData = JSON.parse(storedData);
    return authData;
  }
  return null;
}

/**
 * Checks if the user is logged in by verifying stored token and expiration
 */
export async function isUserLoggedIn(): Promise<boolean> {
  const auth = await getStoredAuth();
  if (auth && auth.expiresAt > Date.now()) {
    return true;
  }
  return false;
}

/**
 * Clears stored authentication data
 */
export async function clearStoredAuth(): Promise<void> {
  await storage.removeItem("auth_data");
}

/**
 * Friendly error messages for common scenarios (RF13)
 */
export function humanizeError(err: ApiError | Error | null | undefined): string | null {
  if (!err) return null;
  const message = err.message || "Ocorreu um erro.";

  // Customize messages based on error content
  if (message.includes("Invalid credentials") || message.includes("credenciais")) {
    return "Dados inválidos";
  }
  if (message.includes("Email already in use") || message.includes("usuário já existe")) {
    return "Já tem um usuário cadastrado com aquele email";
  }

  return message;
}