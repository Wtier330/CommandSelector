<script setup lang="ts">
import type { CommandEntry } from "@commandselector/shared";

defineProps<{
  command: CommandEntry;
}>();

const emit = defineEmits<{
  (e: "export"): void;
  (e: "edit"): void;
  (e: "delete"): void;
}>();
</script>

<template>
  <div class="cs-actions">
    <button
      class="cs-btn-icon cs-btn-export-entry"
      type="button"
      title="导出 JSON"
      @click="emit('export')"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    </button>
    <button
      class="cs-btn-icon"
      type="button"
      title="编辑"
      @click="emit('edit')"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      </svg>
    </button>
    <button
      class="cs-btn-icon cs-btn-delete-entry"
      type="button"
      title="删除"
      @click="emit('delete')"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.cs-actions {
  display: flex;
  gap: 8px;
}

.cs-btn-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.cs-btn-icon:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.cs-btn-export-entry:hover {
  background: #dbeafe;
  color: #2563eb;
  border-color: #bfdbfe;
}

.cs-btn-delete-entry:hover {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fecaca;
}
</style>
