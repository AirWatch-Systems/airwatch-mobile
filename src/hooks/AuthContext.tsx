import React, { createContext, useContext, ReactNode } from 'react';

interface AuthContextType {}

const AuthContext = createContext<AuthContextType>({});

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={{}}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}