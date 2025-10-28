import React, { createContext, useContext, ReactNode } from "react";
import { useAuth } from "./useAuth";

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  isLoading: boolean;
  error: any;
  pendingSessionId: string | null;
  register: (data: any) => Promise<any>;
  loginStart: (data: any) => Promise<any>;
  verify2fa: (sessionId: string, code: string) => Promise<string | null>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}