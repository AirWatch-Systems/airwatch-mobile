import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
} from "react-native";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import { useAuth } from "../../src/hooks/useAuth";
import { userService, UserProfile } from "../../src/services/userService";
import { showAlert } from "../../src/utils/alert";
import AboutContent from "../../src/components/AboutContent";

export default function ProfileScreen() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  
  // Form states
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userProfile = await userService.getProfile();
      setProfile(userProfile);
      setName(userProfile.name);
    } catch {
      showAlert("Erro", "Não foi possível carregar o perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!name.trim()) {
      showAlert("Erro", "Nome não pode estar vazio");
      return;
    }

    setSaving(true);
    try {
      const updatedProfile = await userService.updateProfile({ name: name.trim() });
      setProfile(updatedProfile);
      showAlert("Sucesso", "Nome atualizado com sucesso");
    } catch {
      showAlert("Erro", "Não foi possível atualizar o nome");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showAlert("Erro", "Todos os campos de senha são obrigatórios");
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert("Erro", "Nova senha e confirmação não coincidem");
      return;
    }

    if (newPassword.length < 6) {
      showAlert("Erro", "Nova senha deve ter pelo menos 6 caracteres");
      return;
    }

    setSaving(true);
    try {
      await userService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showAlert("Sucesso", "Senha alterada com sucesso");
    } catch {
      showAlert("Erro", "Não foi possível alterar a senha");
    } finally {
      setSaving(false);
    }
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

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Perfil do Usuário</Text>

        {/* User Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Pessoais</Text>
          
          <Text style={styles.label}>Email</Text>
          <Text style={styles.emailText}>{profile?.email}</Text>

          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Seu nome"
            placeholderTextColor="#9ca3af"
          />
          
          <TouchableOpacity
            style={[styles.button, saving && styles.buttonDisabled]}
            onPress={handleUpdateName}
            disabled={saving}
          >
            <Text style={styles.buttonText}>
              {saving ? "Salvando..." : "Atualizar Nome"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Change Password */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alterar Senha</Text>
          
          <Text style={styles.label}>Senha Atual</Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Senha atual"
            placeholderTextColor="#9ca3af"
            secureTextEntry
          />

          <Text style={styles.label}>Nova Senha</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Nova senha"
            placeholderTextColor="#9ca3af"
            secureTextEntry
          />

          <Text style={styles.label}>Confirmar Nova Senha</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirmar nova senha"
            placeholderTextColor="#9ca3af"
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, saving && styles.buttonDisabled]}
            onPress={handleChangePassword}
            disabled={saving}
          >
            <Text style={styles.buttonText}>
              {saving ? "Alterando..." : "Alterar Senha"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* About Button */}
        <TouchableOpacity
          style={styles.aboutButton}
          onPress={() => setShowAbout(true)}
        >
          <Text style={styles.aboutButtonText}>Sobre o AirWatch</Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Sair da Conta</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* About Modal */}
      <Modal
        visible={showAbout}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowAbout(false)}
            >
              <Text style={styles.closeButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
          <AboutContent />
        </View>
      </Modal>
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
  loadingText: {
    color: "#fff",
    textAlign: "center",
    marginTop: 50,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 24,
    textAlign: "center",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: "#ffd33d",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  label: {
    color: "#e5e7eb",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 12,
  },
  emailText: {
    color: "#9ca3af",
    fontSize: 16,
    padding: 12,
    backgroundColor: "#374151",
    borderRadius: 8,
  },
  input: {
    backgroundColor: "#374151",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: "#6b7280",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  aboutButton: {
    backgroundColor: "#ffd33d",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  aboutButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#dc2626",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#25292e",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
});