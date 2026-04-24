<script setup lang="ts">
import { useMessageState } from "../composables/useMessage";

const { toasts, removeToast, confirmState, handleConfirm, handleCancel } = useMessageState();

// 获取图标
function getIcon(type: string) {
  const icons: Record<string, string> = {
    success: "✓",
    error: "✕",
    warning: "!",
    info: "i"
  };
  return icons[type] || "i";
}
</script>

<template>
  <!-- Toast 通知 -->
  <teleport to="body">
    <div class="cs-toast-container">
      <transition-group name="cs-toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="cs-toast"
          :class="`cs-toast-${toast.type}`"
          @click="removeToast(toast.id)"
        >
          <span class="cs-toast-icon">{{ getIcon(toast.type) }}</span>
          <span class="cs-toast-message">{{ toast.message }}</span>
        </div>
      </transition-group>
    </div>

    <!-- 确认对话框 -->
    <ConfirmDialog
      v-if="confirmState.visible"
      :title="confirmState.title"
      :message="confirmState.message || ''"
      :confirm-text="confirmState.confirmText"
      :cancel-text="confirmState.cancelText"
      :type="confirmState.type"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />
  </teleport>
</template>

<style scoped>
.cs-toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 5000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.cs-toast {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  min-width: 300px;
  max-width: 500px;
  cursor: pointer;
  border-left: 4px solid;
}

.cs-toast-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.cs-toast-message {
  flex: 1;
  font-size: 14px;
  color: #374151;
}

/* Success 样式 */
.cs-toast-success {
  border-left-color: #10b981;
}

.cs-toast-success .cs-toast-icon {
  background: #d1fae5;
  color: #059669;
}

/* Error 样式 */
.cs-toast-error {
  border-left-color: #ef4444;
}

.cs-toast-error .cs-toast-icon {
  background: #fee2e2;
  color: #dc2626;
}

/* Warning 样式 */
.cs-toast-warning {
  border-left-color: #f59e0b;
}

.cs-toast-warning .cs-toast-icon {
  background: #fef3c7;
  color: #d97706;
}

/* Info 样式 */
.cs-toast-info {
  border-left-color: #3b82f6;
}

.cs-toast-info .cs-toast-icon {
  background: #dbeafe;
  color: #2563eb;
}

/* 动画 */
.cs-toast-enter-active {
  animation: cs-toast-in 0.3s ease-out;
}

.cs-toast-leave-active {
  animation: cs-toast-out 0.3s ease-in;
}

@keyframes cs-toast-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes cs-toast-out {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}
</style>
