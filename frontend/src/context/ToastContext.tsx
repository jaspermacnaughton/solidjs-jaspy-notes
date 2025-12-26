import { createContext, useContext, createSignal, ParentComponent, For } from "solid-js";

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  showInfo: (message: string) => void;
  showWarning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType>();

export const ToastContextProvider: ParentComponent = (props) => {
  const [toasts, setToasts] = createSignal<Toast[]>([]);
  let toastIdCounter = 0;

  const removeToast = (id: number) => {
    setToasts(toasts => toasts.filter(toast => toast.id !== id));
  };

  const showToast = (message: string, type: ToastType = 'info', duration: number = 5000) => {
    const id = toastIdCounter++;
    const toast: Toast = { id, message, type, duration };
    
    setToasts(toasts => [...toasts, toast]);
    
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  };

  const showError = (message: string) => showToast(message, 'error', 5000);
  const showSuccess = (message: string) => showToast(message, 'success', 3000);
  const showInfo = (message: string) => showToast(message, 'info', 3000);
  const showWarning = (message: string) => showToast(message, 'warning', 4000);

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      case 'info':
      default:
        return 'bg-blue-500 text-white';
    }
  };

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'check_circle';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'info';
    }
  };

  return (
    <ToastContext.Provider value={{
      showToast,
      showError,
      showSuccess,
      showInfo,
      showWarning
    }}>
      {props.children}
      
      {/* Toast Container */}
      <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <For each={toasts()}>
          {(toast) => (
            <div
              class={`${getToastStyles(toast.type)} px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-[400px] pointer-events-auto animate-slide-in`}
              style={{
                animation: 'slideIn 0.3s ease-out'
              }}
            >
              <span class="material-symbols-outlined">
                {getToastIcon(toast.type)}
              </span>
              <span class="flex-1">{toast.message}</span>
              <button
                class="material-symbols-outlined hover:bg-black hover:bg-opacity-20 rounded cursor-pointer p-1"
                onClick={() => removeToast(toast.id)}
              >
                close
              </button>
            </div>
          )}
        </For>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastContextProvider");
  }
  return context;
};

