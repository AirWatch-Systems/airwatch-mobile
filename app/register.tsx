import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Link, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../src/hooks/useAuth";
import { ErrorToast, LoadingOverlay } from "../src/components/common";

export default function RegisterScreen() {
  const {
    register,
    isAuthenticated,
    isAuthenticating,
  } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onPressRegister = async () => {
    setErrorMessage(null);
    const result = await register({ name, email, password, confirmPassword });
    // Sucesso: limpa campos
    if (result) {
      setPassword("");
      setConfirmPassword("");
      setSuccessMessage("Usuário Cadastrado com Sucesso!");
    } else {
      setErrorMessage("Já existe um usuário cadastrado com esse email!");
    }
  };

  if (isAuthenticated) {
    return <Redirect href="/home" />;
  }

  return (
    <View style={styles.container}>
      <LoadingOverlay visible={isAuthenticating} message="Autenticando..." />
      <ErrorToast
        visible={Boolean(errorMessage)}
        message={errorMessage || ""}
        type="error"
        onDismiss={() => setErrorMessage(null)}
      />
      <ErrorToast
        visible={Boolean(successMessage)}
        message={successMessage || ""}
        type="success"
        onDismiss={() => setSuccessMessage(null)}
      />

      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Ionicons name="leaf" size={28} color="#ffd33d" />
            <Text style={styles.title}>AirWatch</Text>
          </View>
          <Text style={styles.subtitle}>
            Monitore a qualidade do ar perto de você.
          </Text>

          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="person-circle-outline"
                size={18}
                color="#ffd33d"
              />
              <Text style={styles.sectionTitle}>Cadastro</Text>
            </View>

            <TextInput
              placeholder="Nome"
              placeholderTextColor="#9ca3af"
              value={name}
              onChangeText={setName}
              style={styles.input}
              autoCapitalize="words"
            />

            <TextInput
              placeholder="E-mail"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
            />

            <TextInput
              placeholder="Senha"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={styles.input}
            />

            <TextInput
              placeholder="Confirmar senha"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={styles.input}
            />

            <Pressable style={styles.button} onPress={onPressRegister}>
              <Text style={styles.buttonText}>Cadastrar</Text>
            </Pressable>

            <Link href="/login" asChild>
              <Pressable style={styles.ghostButton}>
                <Ionicons name="swap-vertical" size={14} color="#fff" />
                <Text style={styles.ghostButtonText}>Já tenho conta</Text>
              </Pressable>
            </Link>

            {isAuthenticating && (
              <View style={styles.centerRow}>
                <ActivityIndicator color="#ffd33d" />
                <Text style={styles.muted}>Processando...</Text>
              </View>
            )}
          </View>

          <Text style={styles.hint}>
            Após autenticar, você será redirecionado para as abas com o mapa,
            localização atual e painel da qualidade do ar.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingTop: 48,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
  },
  subtitle: {
    color: "#cbd5e1",
    marginBottom: 6,
  },
  card: {
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    color: "#e5e7eb",
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  input: {
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#e5e7eb",
    marginBottom: 8,
  },
  button: {
    backgroundColor: "#ffd33d",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#111827",
    fontWeight: "800",
  },
  ghostButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#374151",
    marginTop: 8,
  },
  ghostButtonText: {
    color: "#fff",
    fontSize: 12,
  },
  muted: {
    color: "#9ca3af",
  },
  centerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  hint: {
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 12,
  },
});