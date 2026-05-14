<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  hasChanges: boolean;
  isSaving?: boolean;
  isGenerating?: boolean;
  isAIConfigured?: boolean;
}>();

const emit = defineEmits<{
  (e: "insert-template"): void;
  (e: "save"): void;
  (e: "close"): void;
  (e: "generate-metadata"): void;
}>();

const showAIBtn = computed(() => props.isAIConfigured === true);
</script>

<template>
  <div class="cs-dialog-actions">
    <button
      v-if="showAIBtn"
      class="cs-btn-icon cs-btn-icon--text cs-btn-ai"
      type="button"
      title="AI 生成元数据"
      :disabled="isGenerating"
      @click="emit('generate-metadata')"
    >
      <svg v-if="isGenerating" class="icon-spin" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" stroke-dasharray="31.4" stroke-dashoffset="10"/>
      </svg>
      <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
      </svg>
      <span>{{ isGenerating ? 'AI 生成中...' : 'AI 生成' }}</span>
    </button>
    <button
      class="cs-btn-icon cs-btn-icon--text"
      type="button"
      title="插入注释模板 (Ctrl+Shift+D)"
      @click="emit('insert-template')"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
      <span>插入模板</span>
    </button>
    <button
      class="cs-btn-icon cs-btn-icon--text"
      type="button"
      title="保存 (Ctrl+S)"
      :disabled="isSaving"
      @click="emit('save')"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
      </svg>
      <span>{{ isSaving ? '保存中...' : '保存' }}</span>
    </button>
    <button
      class="cs-btn-icon cs-btn-icon-sm"
      type="button"
      title="关闭"
      @click="emit('close')"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  </div>
</template>

<style scoped>
.cs-dialog-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.icon-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
