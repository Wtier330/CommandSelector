import { ref } from "vue";

// Toast 消息类型
type ToastType = "success" | "error" | "warning" | "info";

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

// 确认对话框状态
interface ConfirmState {
  visible: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  onConfirm?: () => void;
  onCancel?: () => void;
}

// 全局状态
const toasts = ref<ToastMessage[]>([]);
const confirmState = ref<ConfirmState>({
  visible: false
});

// 生成唯一 ID
let toastIdCounter = 0;

/**
 * 显示 Toast 消息
 */
export function showToast(
  type: ToastType,
  message: string,
  duration: number = 3000
) {
  const id = `toast-${toastIdCounter++}`;
  toasts.value.push({
    id,
    type,
    message,
    duration
  });

  // 自动消失
  setTimeout(() => {
    removeToast(id);
  }, duration);
}

/**
 * 移除 Toast
 */
function removeToast(id: string) {
  const index = toasts.value.findIndex((t) => t.id === id);
  if (index >= 0) {
    toasts.value.splice(index, 1);
  }
}

/**
 * 显示确认对话框（返回 Promise）
 */
export function showConfirm(options: {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
}): Promise<boolean> {
  return new Promise((resolve) => {
    confirmState.value = {
      visible: true,
      title: options.title || "确认",
      message: options.message,
      confirmText: options.confirmText || "确定",
      cancelText: options.cancelText || "取消",
      type: options.type || "danger",
      onConfirm: () => {
        confirmState.value.visible = false;
        resolve(true);
      },
      onCancel: () => {
        confirmState.value.visible = false;
        resolve(false);
      }
    };
  });
}

/**
 * 简便函数
 */
export const useMessage = () => ({
  success: (message: string, duration?: number) => showToast("success", message, duration),
  error: (message: string, duration?: number) => showToast("error", message, duration),
  warning: (message: string, duration?: number) => showToast("warning", message, duration),
  info: (message: string, duration?: number) => showToast("info", message, duration),
  confirm: (options: Parameters<typeof showConfirm>[0]) => showConfirm(options)
});

// 导出状态用于组件
export function useMessageState() {
  return {
    toasts,
    confirmState,
    removeToast,
    handleConfirm: () => confirmState.value.onConfirm?.(),
    handleCancel: () => confirmState.value.onCancel?.()
  };
}