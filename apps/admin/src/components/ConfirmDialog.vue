<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";

interface Props {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
}

withDefaults(defineProps<Props>(), {
  title: "确认",
  confirmText: "确定",
  cancelText: "取消",
  type: "danger"
});

const emit = defineEmits<{
  (e: "confirm"): void;
  (e: "cancel"): void;
}>();

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === "Escape") emit("cancel");
  else if (e.key === "Enter") emit("confirm");
}

onMounted(() => window.addEventListener("keydown", handleKeyDown));
onUnmounted(() => window.removeEventListener("keydown", handleKeyDown));
</script>

<template>
  <teleport to="body">
    <div class="cs-confirm-overlay" @click.self="emit('cancel')">
      <div class="cs-confirm-dialog">
        <div class="cs-confirm-header">
          <div class="cs-confirm-icon" :class="`cs-confirm-icon-${type}`">
            <span v-if="type === 'danger'">⚠️</span>
            <span v-else-if="type === 'warning'">🔔</span>
            <span v-else>ℹ️</span>
          </div>
          <div class="cs-confirm-title">{{ title }}</div>
        </div>

        <div class="cs-confirm-body">
          {{ message }}
        </div>

        <div class="cs-confirm-footer">
          <button
            class="cs-btn cs-btn-cancel"
            type="button"
            @click="emit('cancel')"
          >
            {{ cancelText }}
          </button>
          <button
            class="cs-btn cs-btn-confirm"
            :class="`cs-btn-${type}`"
            type="button"
            @click="emit('confirm')"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
.cs-confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(20, 20, 19, 0.4);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4000;
  animation: cs-fade-in 0.15s ease-out;
}

@keyframes cs-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.cs-confirm-dialog {
  background: var(--claude-ivory, white);
  border: 1px solid var(--claude-border, #e5e7eb);
  border-radius: var(--claude-radius-lg, 12px);
  width: 400px;
  max-width: 90%;
  display: flex;
  flex-direction: column;
  box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.08);
  animation: cs-slide-up 0.2s ease-out;
}

@keyframes cs-slide-up {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.cs-confirm-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 24px;
  border-bottom: 1px solid var(--claude-border-warm, #e5e7eb);
}

.cs-confirm-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.cs-confirm-icon-danger {
  background: #fee2e2;
}

.cs-confirm-icon-warning {
  background: #fef3c7;
}

.cs-confirm-icon-info {
  background: #dbeafe;
}

.cs-confirm-title {
  font-size: 18px;
  font-weight: 500;
  color: var(--claude-text-primary, #1f2937);
}

.cs-confirm-body {
  padding: 20px 24px;
  font-size: 15px;
  color: var(--claude-text-secondary, #4b5563);
  line-height: 1.6;
}

.cs-confirm-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--claude-border-warm, #e5e7eb);
  background: var(--claude-parchment, #fafafa);
  border-radius: 0 0 var(--claude-radius-lg, 12px) var(--claude-radius-lg, 12px);
}

.cs-btn {
  padding: 10px 20px;
  border-radius: var(--claude-radius-sm, 6px);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid;
  transition: all 0.15s ease;
}

.cs-btn-cancel {
  background: var(--claude-ivory, white);
  color: var(--claude-text-primary, #374151);
  border-color: var(--claude-border-warm, #d1d5db);
}

.cs-btn-cancel:hover {
  background: var(--claude-parchment, #f9fafb);
  border-color: var(--claude-text-tertiary, #9ca3af);
}

.cs-btn-confirm {
  color: white;
}

.cs-btn-danger {
  background: #ef4444;
  border-color: #ef4444;
}

.cs-btn-danger:hover {
  background: #dc2626;
  border-color: #dc2626;
}

.cs-btn-warning {
  background: #f59e0b;
  border-color: #f59e0b;
}

.cs-btn-warning:hover {
  background: #d97706;
  border-color: #d97706;
}

.cs-btn-info {
  background: #3b82f6;
  border-color: #3b82f6;
}

.cs-btn-info:hover {
  background: #2563eb;
  border-color: #2563eb;
}
</style>
