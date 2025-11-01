import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AuthService } from '../src/services/auth';
import { showAlert } from '../src/utils/alert';

export default function TwoFactorScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (timeLeft === 0) {
      showAlert(
        'Código Expirado',
        'O código de verificação expirou. Deseja receber um novo código?',
        [
          { text: 'Cancelar', style: 'cancel', onPress: () => router.replace('/login') },
          { text: 'Reenviar', onPress: handleResendCode }
        ]
      );
    }
  }, [timeLeft]);

  const handleVerify = async () => {
    if (!code.trim()) {
      showAlert('Erro', 'Digite o código de verificação');
      return;
    }

    if (!sessionId) {
      showAlert('Erro', 'Sessão inválida');
      router.replace('/login');
      return;
    }

    setLoading(true);
    try {
      const authService = AuthService.getInstance();
      await authService.verify2FA(sessionId, code.trim());
      
      router.replace('/(tabs)/about');
    } catch (error: any) {
      showAlert('Erro', error.message || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!sessionId) return;
    
    try {
      // Reset timer and state
      setTimeLeft(300);
      setCanResend(false);
      setCode('');
      
      // In a real app, you would call an API to resend the code
      // For now, we'll just show a message
      showAlert('Código Reenviado', 'Um novo código foi enviado. Verifique os logs da API.');
    } catch {
      showAlert('Erro', 'Não foi possível reenviar o código');
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Verificação em Duas Etapas</Text>
        <Text style={styles.subtitle}>
          Digite o código de 6 dígitos que foi enviado para você
        </Text>
        
        {timeLeft > 0 && (
          <Text style={styles.timer}>
            Código expira em: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </Text>
        )}

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="000000"
            placeholderTextColor="#9ca3af"
            value={code}
            onChangeText={setCode}
            keyboardType="numeric"
            maxLength={6}
            textAlign="center"
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.buttonText}>Verificar</Text>
            )}
          </TouchableOpacity>

          {canResend && (
            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleResendCode}
              disabled={loading}
            >
              <Text style={styles.resendButtonText}>Reenviar Código</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            disabled={loading}
          >
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 24,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 20,
    fontSize: 24,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#4b5563',
    letterSpacing: 8,
  },
  button: {
    backgroundColor: '#ffd33d',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  backButton: {
    padding: 16,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  timer: {
    fontSize: 14,
    color: '#ffd33d',
    textAlign: 'center',
    marginBottom: 24,
  },
  resendButton: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  resendButtonText: {
    fontSize: 16,
    color: '#ffd33d',
    fontWeight: '600',
  },
});