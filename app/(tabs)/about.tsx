import {
  Text,
  View,
  StyleSheet,
  Linking,
  ScrollView,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../src/hooks/useAuth";
import { showAlert } from "../../src/utils/alert";

export default function AboutScreen() {
  const { logout } = useAuth();
  
  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  const handleLogout = () => {
    showAlert(
      "Logout",
      "Deseja sair da sua conta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/login");
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>AirWatch - About</Text>
        <Text style={styles.paragraph}>
          Sistema distribuído para monitoramento em tempo real da qualidade do
          ar com app móvel (React Native/Expo) e API REST (.NET 7). Este app
          demonstra autenticação com 2FA, localização, consulta de índices de
          poluentes, registro e listagem de feedbacks, mapas e histórico
          pessoal.
        </Text>

        <Text style={styles.sectionHeader}>Requisitos Funcionais (Resumo)</Text>
        <Text style={styles.listItem}>
          RF01: Cadastro de Usuário (validação e hash)
        </Text>
        <Text style={styles.listItem}>
          RF02: Autenticação 2FA (login + verificação)
        </Text>
        <Text style={styles.listItem}>
          RF03: Localização Atual (permissão + GPS)
        </Text>
        <Text style={styles.listItem}>
          RF04: Índices de Poluentes (atual e 24h)
        </Text>
        <Text style={styles.listItem}>RF05: Visualização de Feedbacks</Text>
        <Text style={styles.listItem}>
          RF06: Registro de Feedback (nota + comentário)
        </Text>
        <Text style={styles.listItem}>RF07: Pesquisa de Localizações</Text>
        <Text style={styles.listItem}>RF08: Marcadores no Mapa</Text>
        <Text style={styles.listItem}>RF09: Alertas em Tempo Real (push)</Text>
        <Text style={styles.listItem}>RF10: Histórico Pessoal</Text>
        <Text style={styles.listItem}>RF11: Documentação da API (Swagger)</Text>

        <Text style={styles.listItem}>RF12: Comunicação Distribuída</Text>
        <Text style={styles.listItem}>RF13: Tratamento de Erros</Text>
        <Text style={styles.listItem}>
          RF14: Atualização Automática (foreground)
        </Text>

        <Text style={styles.sectionHeader}>Links úteis</Text>
        <Pressable onPress={() => openLink("http://localhost:5000/swagger")}>
          <Text style={styles.link}>
            Swagger (HTTP) - http://localhost:5000/swagger
          </Text>
        </Pressable>
        <Pressable onPress={() => openLink("https://localhost:5001/swagger")}>
          <Text style={styles.link}>
            Swagger (HTTPS) - https://localhost:5001/swagger
          </Text>
        </Pressable>

        <Text style={styles.paragraphSmall}>
          Dica: configure EXPO_PUBLIC_API_URL no frontend para apontar para a
          URL da API.
        </Text>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Sair da Conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor: "#25292e",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
  },
  paragraph: {
    color: "#e5e7eb",
    lineHeight: 20,
    marginBottom: 10,
  },
  sectionHeader: {
    color: "#ffd33d",
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 6,
  },
  listItem: {
    color: "#cbd5e1",
    marginLeft: 8,
    marginBottom: 4,
  },
  link: {
    color: "#93c5fd",
    textDecorationLine: "underline",
    marginBottom: 8,
  },
  paragraphSmall: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 8,
  },
  logoutButton: {
    backgroundColor: "#dc2626",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
