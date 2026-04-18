<script setup lang="ts">
const props = defineProps<{
  modelValue: 'command' | 'script';
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: 'command' | 'script'): void;
}>();

const modes = [
  { value: 'command' as const, label: '命令库', icon: '📋' },
  { value: 'script' as const, label: '脚本库', icon: '📜' },
];
</script>

<template>
  <div class="cs-mode-switcher">
    <button
      v-for="mode in modes"
      :key="mode.value"
      class="cs-mode-btn"
      :class="{ 'is-active': modelValue === mode.value }"
      type="button"
      @click="emit('update:modelValue', mode.value)"
    >
      <span class="cs-mode-icon">{{ mode.icon }}</span>
      <span class="cs-mode-label">{{ mode.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.cs-mode-switcher {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: var(--cs-muted, #f3f4f6);
  border-radius: 8px;
}

.cs-mode-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--cs-text-muted, #6b7280);
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cs-mode-btn:hover:not(.is-active) {
  background: rgba(255, 255, 255, 0.5);
}

.cs-mode-btn.is-active {
  background: white;
  color: var(--cs-text, #111827);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.cs-mode-icon {
  font-size: 16px;
  line-height: 1;
}

.cs-mode-label {
  white-space: nowrap;
}
</style>
