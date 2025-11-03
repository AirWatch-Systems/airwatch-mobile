import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useAuth } from '../hooks/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, loading, saveCurrentRoute } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Store the current path to redirect back after login
      if (pathname !== '/login' && pathname !== '/two-factor' && pathname !== '/register') {
        saveCurrentRoute(pathname);
      }
      router.replace('/login');
    }
  }, [loading, isAuthenticated, pathname, saveCurrentRoute]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#25292e' }}>
        <ActivityIndicator size="large" color="#ffd33d" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}