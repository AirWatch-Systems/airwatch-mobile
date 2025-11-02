import { Platform } from 'react-native';

export interface ToastOptions {
  duration?: number;
  type?: 'success' | 'error' | 'warning' | 'info';
}

let toastContainer: HTMLElement | null = null;

function createToastContainer() {
  if (Platform.OS !== 'web') return;
  
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

function getToastStyles(type: string) {
  const baseStyles = `
    margin-bottom: 10px;
    padding: 12px 16px;
    border-radius: 8px;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    pointer-events: auto;
    max-width: 350px;
    word-wrap: break-word;
    animation: slideIn 0.3s ease-out;
  `;

  const typeStyles = {
    success: 'background-color: #10b981;',
    error: 'background-color: #ef4444;',
    warning: 'background-color: #f59e0b;',
    info: 'background-color: #3b82f6;'
  };

  return baseStyles + (typeStyles[type as keyof typeof typeStyles] || typeStyles.info);
}

export function showToast(message: string, options: ToastOptions = {}) {
  if (Platform.OS !== 'web') {
    // Fallback para mobile - usar alert simples
    alert(message);
    return;
  }

  const { duration = 4000, type = 'info' } = options;
  const container = createToastContainer();
  
  if (!container) return;

  // Adicionar estilos de animação se não existirem
  if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = getToastStyles(type);
  
  container.appendChild(toast);

  // Auto remove
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-in';    
    setTimeout(() => {
      if (toast.parentNode) {        
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);
}

export function showSuccessToast(message: string, duration?: number) {
  showToast(message, { type: 'success', duration });
}

export function showErrorToast(message: string, duration?: number) {
  showToast(message, { type: 'error', duration });
}

export function showWarningToast(message: string, duration?: number) {
  showToast(message, { type: 'warning', duration });
}

export function showInfoToast(message: string, duration?: number) {
  showToast(message, { type: 'info', duration });
}