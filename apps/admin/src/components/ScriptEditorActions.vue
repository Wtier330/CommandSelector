<script setup lang="ts">
const props = defineProps<{
  hasChanges: boolean;
}>();

const emit = defineEmits<{
  (e: "insert-template"): void;
  (e: "save"): void;
  (e: "close"): void;
}>();
</script>

<template>
  <div class="cs-dialog-actions">
    <button
      class="cs-btn cs-btn-icon"
      type="button"
      title="插入注释模板 (Ctrl+Shift+D)"
      @click="emit('insert-template')"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.5 20a6.5 6.5 0 1 1 0-12 6.5 6.5 0 0 1 0 12Z" />
        <path d="M16.2 12.2 20.2 20.2H4a2 2 0 0 0-2 2v16a2 2 0 0 2 2h16a2 2 0 0 2-2Z" />
        <line x1="12" y1="12" x2="12" y2="16" stroke-dasharray="3,3" />
      </svg>
      <span>插入模板</span>
    </button>
    <button
      class="cs-btn cs-btn-icon"
      type="button"
      title="保存 (Ctrl+S)"
      @click="emit('save')"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 21H5a2 2 0 0 0 2h14a2 2 0 0 0 2v14a2 2 0 0 0-2h-14a2 2 0 0 0 2z" />
        <polyline points="16 7 8.5 4 4.5 2 11 16 3" />
      </svg>
      <span>保存</span>
    </button>
    <button
      class="cs-btn-icon"
      type="button"
      title="关闭"
      @click="emit('close')"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="18" x2="18" y2="6" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.cs-dialog-actions {
  display: flex;
  gap: 8px;
}

.cs-btn-icon {
  padding: 4px 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cs-btn-icon:hover {
  background: #f3f4f6;
}

.cs-btn-icon svg {
  width: 16px;
  height: 16px;
  stroke-width: 2px;
}

.cs-btn-icon span {
  font-size: 13.5px;
}
</style>
