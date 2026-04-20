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

// 判断是否显示 AI 生成按钮
const showAIBtn = computed(() => props.isAIConfigured === true);
</script>

<template>
  <div class="cs-dialog-actions">
    <button
      class="cs-btn cs-btn-icon"
      type="button"
      title="插入注释模板 (Ctrl+Shift+D)"
      @click="emit('insert-template')"
    >
      <svg t="1776676829476" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="6832" width="16" height="16"><path d="M64 127.712C64 92.512 92.864 64 128.288 64h255.424C419.232 64 448 92.8 448 127.712V896.32c0 35.2-28.864 63.712-64.288 63.712H128.32C92.768 960 64 931.2 64 896.288V127.68z m64 32.32v703.936c0 17.728 14.272 32.032 31.904 32.032h192.192c17.408 0 31.904-14.336 31.904-32V160c0-17.696-14.272-32-31.904-32H159.904C142.496 128 128 142.336 128 160z m384-31.744C512 92.768 540.704 64 576.192 64h319.616C931.264 64 960 92.864 960 128.288v255.424c0 35.52-28.704 64.288-64.192 64.288h-319.616A64.288 64.288 0 0 1 512 383.712V128.32z m64 31.616v192.192a32 32 0 0 0 31.84 31.904h256.32c17.28 0 31.84-14.272 31.84-31.904V159.904A32 32 0 0 0 864.16 128h-256.32c-17.28 0-31.84 14.272-31.84 31.904z m-64 416.288c0-35.456 28.704-64.192 64.192-64.192h319.616c35.456 0 64.192 28.704 64.192 64.192v319.616A64.16 64.16 0 0 1 895.808 960h-319.616A64.16 64.16 0 0 1 512 895.808v-319.616z m64 31.68v256.288c0 17.28 14.272 31.84 31.84 31.84h256.32c17.28 0 31.84-14.272 31.84-31.84v-256.32c0-17.28-14.272-31.84-31.84-31.84h-256.32c-17.28 0-31.84 14.272-31.84 31.84z" fill="#333333" p-id="6833"></path></svg>
      <span>插入模板</span>
    </button>
    <button
      v-if="showAIBtn"
      class="cs-btn cs-btn-icon"
      type="button"
      title="AI 生成元数据"
      :disabled="isGenerating"
      @click="emit('generate-metadata')"
    >
      <svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>{{ isGenerating ? '生成中...' : 'AI 生成' }}</span>
    </button>
    <button
      class="cs-btn cs-btn-icon"
      type="button"
      title="保存 (Ctrl+S)"
      :disabled="isSaving"
      @click="emit('save')"
    >
      <svg t="1776676934144" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="7837" width="16" height="16"><path d="M689.49333333 370.88h-105.81333333V123.94666667h105.81333333v246.93333333zM971.73333333 265.06666667v599.78666666c0 58.45333333-47.36 105.81333333-105.81333333 105.81333334H160.21333333c-58.45333333 0-105.81333333-47.36-105.81333333-105.81333334V159.14666667c0-58.45333333 47.36-105.81333333 105.81333333-105.81333334h599.78666667c29.22666667 0 46.50666667 21.76 127.46666667 105.6 64.53333333 66.88 84.26666667 76.90666667 84.26666666 106.13333334z m-740.90666666 105.81333333c0 19.41333333 15.78666667 35.30666667 35.30666666 35.30666667h458.66666667c19.41333333 0 35.30666667-15.89333333 35.30666667-35.30666667V123.94666667c0-19.41333333-15.78666667-35.30666667-35.30666667-35.30666667h-458.66666667c-19.41333333 0-35.30666667 15.89333333-35.30666666 35.30666667v246.93333333z m635.09333333 176.42666667c0-19.41333333-15.78666667-35.30666667-35.30666667-35.30666667H195.52c-19.41333333 0-35.30666667 15.89333333-35.30666667 35.30666667v352.85333333c0 19.41333333 15.78666667 35.30666667 35.30666667 35.30666667h635.09333333c19.41333333 0 35.30666667-15.89333333 35.30666667-35.30666667V547.30666667z" fill="#1296db" p-id="7838"></path></svg>
      <span>{{ isSaving ? '保存中...' : '保存' }}</span>
    </button>
    <button
      class="cs-btn-icon"
      type="button"
      title="关闭"
      @click="emit('close')"
    >
      <svg t="1776676767491" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4741" width="16" height="16"><path d="M589.704 501.674L998.27 93.107c20.652-20.653 20.652-54.556 0-75.209l-2.237-2.237c-20.652-20.652-54.556-20.652-75.208 0L512.258 424.745 103.691 15.489c-20.652-20.652-54.556-20.652-75.208 0l-2.238 2.237c-21.168 20.652-21.168 54.556 0 75.208l408.568 408.74L26.245 910.24c-20.652 20.652-20.652 54.556 0 75.208l2.238 2.238c20.652 20.652 54.556 20.652 75.208 0l408.567-408.568 408.568 408.568c20.652 20.652 54.556 20.652 75.208 0l2.237-2.238c20.652-20.652 20.652-54.556 0-75.208L589.704 501.674z" fill="#2C2C2C" p-id="4742"></path></svg>
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
