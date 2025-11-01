import { ActivityIndicator, View } from "react-native";
import { useEffect } from "react";
import { router } from "expo-router";
import { useAuth } from "../src/hooks/useAuth";

export default function IndexScreen() {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.replace("/(tabs)/about");
      } else {
        router.replace("/login");
      }
    }
  }, [loading, isAuthenticated]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#25292e" }}>
      <ActivityIndicator size="large" color="#ffd33d" />
    </View>
  );
}
