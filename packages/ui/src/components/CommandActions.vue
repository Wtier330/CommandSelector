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
      class="cs-btn-icon cs-btn-icon-lg cs-btn-export-entry"
      type="button"
      title="导出 JSON"
      @click="emit('export')"
    >
      <svg t="1777462358803" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5554" width="16" height="16"><path d="M293.632 645.248c91.456-86.784 183.552-220.544 346.88-211.584a20.8 20.8 0 0 1 20.224 20.8v59.392a21.376 21.376 0 0 0 34.432 16.64l211.2-171.2a21.376 21.376 0 0 0 0-33.28l-210.24-192a21.952 21.952 0 0 0-35.648 16.64v60.096a20.8 20.8 0 0 1-17.856 20.8c-280.704 61.76-351.36 391.104-348.992 413.696zM192 960a138.176 138.176 0 0 1-129.984-152.512L64 832V192a116.48 116.48 0 0 1 128-128c-108.8 1.024 256 0 256 0a28.224 28.224 0 0 1 29.76 27.84A35.968 35.968 0 0 1 448 128H192a53.12 53.12 0 0 0-64 64c1.536-37.504 0 640 0 640a52.8 52.8 0 0 0 64 64c49.536-0.448 640 0 640 0a52.48 52.48 0 0 0 64-64c-0.64 105.152 0-256 0-256a36.48 36.48 0 0 1 27.264-38.4A33.216 33.216 0 0 1 960 576v256a116.48 116.48 0 0 1-128 128c-50.56-0.448-640 0-640 0z" fill="#515151" p-id="5555"></path></svg>
    </button>
    <button
      class="cs-btn-icon cs-btn-icon-lg cs-btn-edit-entry"
      type="button"
      title="编辑"
      @click="emit('edit')"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      </svg>
    </button>
    <button
      class="cs-btn-icon cs-btn-icon-lg cs-btn-delete-entry"
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
</style>
