import { Redirect } from "expo-router";

import { useAuth } from "../src/hooks/useAuth";

export default function IndexScreen() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  // Redirecionar para login por padrão
  return <Redirect href="/login" />;
}
