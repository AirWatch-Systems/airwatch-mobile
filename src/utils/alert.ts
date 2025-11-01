import { Platform, Alert } from 'react-native';

export function showAlert(title: string, message: string, buttons?: Array<{
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}>) {
  if (Platform.OS === 'web') {
    if (buttons && buttons.length > 1) {
      const result = confirm(`${title}\n\n${message}`);
      const action = result ? buttons.find(b => b.style !== 'cancel') : buttons.find(b => b.style === 'cancel');
      action?.onPress?.();
    } else {
      alert(`${title}\n\n${message}`);
      buttons?.[0]?.onPress?.();
    }
  } else {
    Alert.alert(title, message, buttons);
  }
}