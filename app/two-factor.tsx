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
import { router } from 'expo-router';
import { AuthService } from '../src/services/auth';
import { SessionManager, TempSession } from '../src/services/sessionManager';
import { showErrorAlert, showSuccessAlert } from '../src/utils/alert';

export default function TwoFactorScreen() {
  const TIMELEFT = 120; // 2 minutes in seconds

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMELEFT);
  const [canResend, setCanResend] = useState(false);
  const [session, setSession] = useState<TempSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão temporária
    const checkSession = async () => {
      const sessionManager = SessionManager.getInstance();
      const tempSession = await sessionManager.getTempSession();
      
      if (!tempSession) {
        showErrorAlert('Sessão expirada. Faça login novamente.');
        router.replace('/login');
        return;
      }
      
      setSession(tempSession);
      // Calcular tempo restante baseado na expiração do código (2 minutos)
      const codeExpiresAt = tempSession.codeGeneratedAt + (2 * 60 * 1000);
      const remaining = Math.max(0, Math.floor((codeExpiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      setSessionLoading(false);
    };
    
    checkSession();
  }, []);

  useEffect(() => {
    if (sessionLoading) return;
    
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
  }, [sessionLoading, setCanResend]);

  useEffect(() => {
    if (timeLeft === 0 && !canResend) {
      showErrorAlert(
        'O código de verificação expirou. Clique em "Reenviar Código" para receber um novo.'
      );
      setCode(''); // Limpar o código quando expirar
    }
  }, [timeLeft, canResend]);

  const handleVerify = async () => {
    if (!code.trim()) {
      showErrorAlert('Digite o código de verificação');
      return;
    }

    if (!session) {
      showErrorAlert('Sessão inválida');
      router.replace('/login');
      return;
    }

    setLoading(true);
    try {
      const authService = AuthService.getInstance();
      
      // Verificar o 2FA
      await authService.verify2FA(session.sessionId, code.trim());
      
      // Limpar sessão temporária após sucesso
      const sessionManager = SessionManager.getInstance();
      await sessionManager.clearTempSession();
      
      showSuccessAlert('Autenticação realizada com sucesso!');
      
      // Redirecionar para index que gerencia a navegação
      router.replace('/');
    } catch (error: any) {
      showErrorAlert(error.message || 'Código de verificação inválido');
      setCode(''); // Limpar o código quando houver erro
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!session) return;
    
    setLoading(true);
    try {
      console.log('Resending code for sessionId:', session.sessionId);
      const authService = AuthService.getInstance();
      await authService.resend2FACode(session.sessionId);
      
      // Atualizar timestamp do código na sessão
      const sessionManager = SessionManager.getInstance();
      await sessionManager.updateCodeTimestamp();
      
      setTimeLeft(TIMELEFT);
      setCanResend(false);
      setCode('');
      
      showSuccessAlert('Um novo código foi enviado para seu email.');
    } catch (error: any) {
      console.error('Resend error:', error);
      if (error.message?.includes('Sessão expirada')) {
        showErrorAlert('Sessão expirada. Redirecionando para login...');
        setTimeout(() => router.replace('/login'), 2000);
      } else {
        showErrorAlert(error.message || 'Não foi possível reenviar o código');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (sessionLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#ffd33d" />
        <Text style={{ color: '#fff', marginTop: 16 }}>Carregando...</Text>
      </View>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Verificação em Duas Etapas</Text>
        <Text style={styles.subtitle}>
          Digite o código de 6 dígitos enviado para {session?.email || 'você'}
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