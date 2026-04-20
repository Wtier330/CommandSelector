<script setup lang="ts">
const props = defineProps<{
  hasChanges: boolean;
  isSaving?: boolean;
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
      <svg t="1776522097652" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="8908" width="16" height="16"><path d="M329.984 768V342.613333H170.666667V256256h426.666666v86.613333h-158.933333V768zM597.333333 469.333333h256v73.770667h-85.888V768h-84.224v-224.896H597.333333z" fill="#515151" p-id="8909"></path></svg>
      <span>插入模板</span>
    </button>
    <button
      class="cs-btn cs-btn-icon"
      type="button"
      title="保存 (Ctrl+S)"
      :disabled="isSaving"
      @click="emit('save')"
    >
      <svg t="1776522025500" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="7532" width="16" height="16"><path d="M814.805 128a51.179 51.179 0 0 1 51.179 51.179V844.01a51.179 51.179 0 0 1-51.179 51.157H201.173a51.179 51.179 0 0 1-51.178-51.157V179.179A51.179 51.179 0 0 1 201.173 128h613.654zM329.024 434.837a51.093 51.093 0 0 1-51.179-51.093V179.157h-76.672v664.854h613.76V179.179H738.22v204.48a51.179 51.179 0 0 1-51.179 51.178H329.024z m0-51.093h357.995V179.157H329.024v204.587z m357.91 204.501a25.557 25.557 0 1 1 0.085 51.072H329.024a25.536 25.536 0 1 1 0-51.072h357.91z" fill="#333333" p-id="7533"></path></svg>
      <span>{{ isSaving ? '保存中...' : '保存' }}</span>
    </button>
    <button
      class="cs-btn-icon"
      type="button"
      title="关闭"
      @click="emit('close')"
    >
      <svg t="1776522116055" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="10095" width="16" height="16"><path d="M896 224l-96-96-288 288-288-288-96 96 288 288-288 288 96 96 288-288 288 288 96-96-288-288 288-288z" fill="#515151" p-id="10096"></path></svg>
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

.cs-btn-icon:hover:not(:disabled) {
  background: #f3f4f6;
}

.cs-btn-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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