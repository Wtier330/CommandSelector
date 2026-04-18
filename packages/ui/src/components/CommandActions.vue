<script setup lang="ts">
import type { CommandEntry } from "@commandselector/shared";

const props = defineProps<{
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
      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      <span>导出</span>
    </button>
    <button
      class="cs-btn-icon cs-btn-edit-entry"
      type="button"
      title="编辑命令"
      @click="emit('edit')"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M11 4H4a2 2 0 0 0 -2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2 -2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1 1 4 9.5-9.5-9.5z"></path>
      </svg>
      <span>编辑</span>
    </button>
    <button
      class="cs-btn-icon cs-btn-delete-entry"
      type="button"
      title="删除命令"
      @click="emit('delete')"
    >
      <svg t="1774535411098" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="8973" width="16" height="16"><path d="M128 320l0 640c0 35.20512 28.79488 64 64 64l576 0c35.20512 0 64-28.79488 64-64l0-640-704 0zM320 896l-64 0 0-448 64 0 0 448zM448 896l-64 0 0-448 64 0 0 448zM576 896l-64 0 0-448 64 0 0 448zM704 896l-64 0 0-448 64 0 0 448z" fill="#444444" p-id="8974"></path><path d="M847.99488 128l-207.99488 0 0-79.99488c0-26.39872-21.6064-48.00512-48.00512-48.00512l-224.01024 0c-26.39872 0-48.00512 21.6064-48.00512 48.00512l0 79.99488-207.99488 0c-26.39872 0-48.00512 21.6064-48.00512 48.00512l0 79.99488 832 0 0-79.99488c0-26.39872-21.6064-48.00512-48.00512-48.00512zM576 128l-192 0 0-63.20128 192 0 0 63.20128z" fill="#444444" p-id="8975"></path></svg>
      <span>删除</span>
    </button>
  </div>
</template>

<style scoped>
.cs-actions {
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
