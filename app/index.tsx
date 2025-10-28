import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAuthContext } from "../src/hooks/AuthContext";

export default function IndexScreen() {
  const { isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#ffd33d" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/home" />;
  }

  // Redirecionar para login por padrão
  return <Redirect href="/login" />;
}
