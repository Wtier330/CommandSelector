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
      if (options.hasChanges?.value) {
        const confirmed = confirm("有未保存的更改，确定要关闭吗？");
        if (!confirmed) return;
      }
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
