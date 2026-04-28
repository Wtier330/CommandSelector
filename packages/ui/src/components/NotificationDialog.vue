<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  isOpen: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}>();

const emit = defineEmits<{
  close: [];
  confirm: [];
}>();

const dialogColor = computed(() => {
  const colors = {
    success: '#22c55e',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6'
  };
  return colors[props.type];
});

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.isOpen) {
    emit('close');
  }
  if (e.key === 'Enter' && props.isOpen) {
    emit('confirm');
    emit('close');
  }
}
</script>

<template>
  <div v-if="isOpen" class="cs-notification-overlay" tabindex="-1" @click.self="emit('close')" @keydown="handleKeyDown">
    <div class="cs-notification-dialog" role="alertdialog">
      <div class="cs-notification-icon" :style="{ color: dialogColor }">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline v-if="type === 'success'" points="20 6 9 17 4 12" />
          <template v-if="type === 'error'">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </template>
          <polyline v-else-if="type === 'warning'" points="12 2 2 22" />
          <circle v-else-if="type === 'info'" cx="12" cy="12" r="10" />
          <line v-if="type === 'info'" x1="12" y1="16" x2="12" y2="12" />
          <line v-if="type === 'info'" x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </div>
      <div class="cs-notification-content">
        <h3 class="cs-notification-title">{{ title }}</h3>
        <p class="cs-notification-message">{{ message }}</p>
      </div>
      <div class="cs-notification-actions">
        <button class="cs-btn cs-btn-primary" @click="emit('confirm'); emit('close')">
          确定
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cs-notification-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  animation: cs-fade-in 0.2s ease-out;
}

@keyframes cs-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.cs-notification-dialog {
  background: #ffffff;
  border-radius: 14px;
  min-width: 340px;
  max-width: 440px;
  padding: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  display: flex;
  gap: 16px;
  animation: cs-slide-up 0.25s ease-out;
}

@keyframes cs-slide-up {
  from {
    transform: translateY(16px) scale(0.95);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.cs-notification-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 10px;
  flex-shrink: 0;
}

.cs-notification-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cs-notification-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.cs-notification-message {
  margin: 0;
  font-size: 14px;
  color: #64748b;
  line-height: 1.5;
}

.cs-notification-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.cs-btn {
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  outline: none;
}

.cs-btn-primary {
  background: #3b82f6;
  color: #ffffff;
}

.cs-btn-primary:hover {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.cs-btn-primary:active {
  transform: translateY(0);
}
</style>