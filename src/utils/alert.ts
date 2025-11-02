import { Platform, Alert } from 'react-native';
import { showToast, showErrorToast, showSuccessToast, showWarningToast } from './toast';

export function showAlert(title: string, message: string, buttons?: {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}[]) {
  if (Platform.OS === 'web') {
    if (buttons && buttons.length > 1) {
      const result = confirm(`${title}\n\n${message}`);
      const action = result ? buttons.find(b => b.style !== 'cancel') : buttons.find(b => b.style === 'cancel');
      action?.onPress?.();
    } else {
      // Para alertas simples na web, usar toast se for erro
      if (title.toLowerCase().includes('erro')) {
        showErrorToast(message);
      } else if (title.toLowerCase().includes('sucesso')) {
        showSuccessToast(message);
      } else if (title.toLowerCase().includes('aviso')) {
        showWarningToast(message);
      } else {
        showToast(message);
      }
      buttons?.[0]?.onPress?.();
    }
  } else {
    Alert.alert(title, message, buttons);
  }
}

// Funções auxiliares para diferentes tipos de alerta
export function showErrorAlert(message: string, onPress?: () => void) {
  showAlert('Erro', message, onPress ? [{ text: 'OK', onPress }] : undefined);
}

export function showSuccessAlert(message: string, onPress?: () => void) {
  showAlert('Sucesso', message, onPress ? [{ text: 'OK', onPress }] : undefined);
}

export function showWarningAlert(message: string, onPress?: () => void) {
  showAlert('Aviso', message, onPress ? [{ text: 'OK', onPress }] : undefined);
}