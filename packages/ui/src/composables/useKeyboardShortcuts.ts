import { onMounted, onUnmounted, type Ref } from "vue";

export interface KeyboardShortcutsOptions {
  onSave?: () => void;
  onClose?: () => void;
  onInsertTemplate?: () => void;
  hasChanges?: Ref<boolean>;
}

/**
 * 键盘快捷键处理
 * @param options - 快捷键配置选项
 */
export function useKeyboardShortcuts(options: KeyboardShortcutsOptions) {
  function handleKeyDown(e: KeyboardEvent) {
    // Ctrl+Shift+D 插入注释模板
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "d") {
      e.preventDefault();
      options.onInsertTemplate?.();
    }
    // Ctrl+S 保存
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      options.onSave?.();
    }
    // ESC 关闭
    if (e.key === "Escape") {
      // 直接调用 onClose，让调用者处理确认逻辑
      options.onClose?.();
    }
  }

  onMounted(() => {
    window.addEventListener("keydown", handleKeyDown);
  });

  onUnmounted(() => {
    window.removeEventListener("keydown", handleKeyDown);
  });

  return {
    handleKeyDown
  };
}
