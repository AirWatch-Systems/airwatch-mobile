import { ActivityIndicator, View } from "react-native";
import { useEffect } from "react";
import { router } from "expo-router";
import { useAuth } from "../src/hooks/useAuth";
import { AuthService } from "../src/services/auth";

export default function IndexScreen() {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    const handleNavigation = async () => {
      if (!loading) {
        if (isAuthenticated) {
          const authService = AuthService.getInstance();
          const isFirst = await authService.isFirstLogin();
          
          if (isFirst) {
            // Primeiro login - ir para home
            await authService.clearFirstLogin();
            router.replace("/(tabs)");
          } else {
            // Login subsequente - verificar se há rota salva
            const lastRoute = await authService.getLastRoute();
            if (lastRoute && lastRoute !== '/login' && lastRoute !== '/register' && lastRoute !== '/') {
              await authService.clearLastRoute();
              router.replace(lastRoute as any);
            } else {
              router.replace("/(tabs)");
            }
          }
        } else {
          router.replace("/login");
        }
      }
    };

    handleNavigation();
  }, [loading, isAuthenticated]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#25292e" }}>
      <ActivityIndicator size="large" color="#ffd33d" />
    </View>
  );
}
