<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  promptConfigManager,
  DEFAULT_METADATA_PROMPT,
  DEFAULT_COMMAND_PROMPT,
  METADATA_TEMPLATE_VARIABLES,
  COMMAND_TEMPLATE_VARIABLES,
  type AIPromptTemplates,
} from '../utils/promptConfig';

const emit = defineEmits<{
  saved: [];
}>();

// 提示词编辑状态
const metadataPrompt = ref('');
const commandPrompt = ref('');
const isSaving = ref(false);
const saveResult = ref<{ success: boolean; message: string } | null>(null);
const isLoaded = ref(false);

// 当前展开的变量说明
const showMetaVars = ref(false);
const showCmdVars = ref(false);

onMounted(async () => {
  await loadTemplates();
});

async function loadTemplates() {
  const templates = await promptConfigManager.getTemplates();
  metadataPrompt.value = templates.metadataPrompt || DEFAULT_METADATA_PROMPT;
  commandPrompt.value = templates.commandPrompt || DEFAULT_COMMAND_PROMPT;
  isLoaded.value = true;
}

async function handleSave() {
  isSaving.value = true;
  saveResult.value = null;

  try {
    const templates: AIPromptTemplates = {
      metadataPrompt: metadataPrompt.value.trim() === DEFAULT_METADATA_PROMPT.trim()
        ? null
        : metadataPrompt.value.trim() || null,
      commandPrompt: commandPrompt.value.trim() === DEFAULT_COMMAND_PROMPT.trim()
        ? null
        : commandPrompt.value.trim() || null,
    };

    await promptConfigManager.saveTemplates(templates);
    saveResult.value = { success: true, message: '提示词已保存' };
    emit('saved');
  } catch {
    saveResult.value = { success: false, message: '保存失败' };
  } finally {
    isSaving.value = false;
  }
}

function handleReset() {
  metadataPrompt.value = DEFAULT_METADATA_PROMPT;
  commandPrompt.value = DEFAULT_COMMAND_PROMPT;
  saveResult.value = null;
}

function isMetadataDefault(): boolean {
  return metadataPrompt.value.trim() === DEFAULT_METADATA_PROMPT.trim();
}

function isCommandDefault(): boolean {
  return commandPrompt.value.trim() === DEFAULT_COMMAND_PROMPT.trim();
}
</script>

<template>
  <div class="cs-prompt-config" v-if="isLoaded">
    <!-- 元数据生成提示词 -->
    <div class="cs-prompt-section">
      <div class="cs-prompt-section-header">
        <span class="cs-prompt-section-title">脚本元数据生成</span>
        <span
          v-if="!isMetadataDefault()"
          class="cs-prompt-badge cs-prompt-badge-modified"
        >已自定义</span>
        <span
          v-else
          class="cs-prompt-badge cs-prompt-badge-default"
        >默认</span>
      </div>
      <p class="cs-prompt-section-desc">
        用于从脚本文件内容生成元数据（名称、描述、分类、标签等）
      </p>
      <textarea
        v-model="metadataPrompt"
        class="cs-prompt-textarea"
        rows="8"
        spellcheck="false"
      />
      <button
        class="cs-prompt-var-toggle"
        @click="showMetaVars = !showMetaVars"
      >
        {{ showMetaVars ? '收起' : '查看可用变量' }}
      </button>
      <div v-if="showMetaVars" class="cs-prompt-var-list">
        <div
          v-for="v in METADATA_TEMPLATE_VARIABLES"
          :key="v.key"
          class="cs-prompt-var-item"
        >
          <code class="cs-prompt-var-key">{{ v.key }}</code>
          <span class="cs-prompt-var-desc">{{ v.desc }}</span>
        </div>
      </div>
    </div>

    <!-- 命令补全提示词 -->
    <div class="cs-prompt-section">
      <div class="cs-prompt-section-header">
        <span class="cs-prompt-section-title">命令元数据补全</span>
        <span
          v-if="!isCommandDefault()"
          class="cs-prompt-badge cs-prompt-badge-modified"
        >已自定义</span>
        <span
          v-else
          class="cs-prompt-badge cs-prompt-badge-default"
        >默认</span>
      </div>
      <p class="cs-prompt-section-desc">
        用于根据已有信息补全命令的描述、分类、标签和使用说明
      </p>
      <textarea
        v-model="commandPrompt"
        class="cs-prompt-textarea"
        rows="6"
        spellcheck="false"
      />
      <button
        class="cs-prompt-var-toggle"
        @click="showCmdVars = !showCmdVars"
      >
        {{ showCmdVars ? '收起' : '查看可用变量' }}
      </button>
      <div v-if="showCmdVars" class="cs-prompt-var-list">
        <div
          v-for="v in COMMAND_TEMPLATE_VARIABLES"
          :key="v.key"
          class="cs-prompt-var-item"
        >
          <code class="cs-prompt-var-key">{{ v.key }}</code>
          <span class="cs-prompt-var-desc">{{ v.desc }}</span>
        </div>
      </div>
    </div>

    <!-- 操作栏 -->
    <div class="cs-prompt-actions">
      <div v-if="saveResult" class="cs-prompt-result" :class="saveResult.success ? 'success' : 'error'">
        {{ saveResult.message }}
      </div>
      <div class="cs-prompt-actions-btns">
        <button
          class="cs-prompt-btn cs-prompt-btn-reset"
          @click="handleReset"
        >
          恢复默认
        </button>
        <button
          class="cs-prompt-btn cs-prompt-btn-save"
          :disabled="isSaving"
          @click="handleSave"
        >
          {{ isSaving ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>
  </div>
  <div v-else class="cs-prompt-loading">加载中...</div>
</template>

<style scoped>
.cs-prompt-config {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cs-prompt-section {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
}

.cs-prompt-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.cs-prompt-section-title {
  font-weight: 600;
  font-size: 14px;
  color: #111827;
}

.cs-prompt-badge {
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}

.cs-prompt-badge-default {
  background: #f3f4f6;
  color: #6b7280;
}

.cs-prompt-badge-modified {
  background: #dbeafe;
  color: #2563eb;
}

.cs-prompt-section-desc {
  margin: 0 0 12px 0;
  font-size: 12px;
  color: #6b7280;
}

.cs-prompt-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 12px;
  font-family: 'Cascadia Code', 'Fira Code', monospace;
  line-height: 1.5;
  resize: vertical;
  box-sizing: border-box;
  min-height: 80px;
}

.cs-prompt-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.cs-prompt-var-toggle {
  margin-top: 8px;
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
}

.cs-prompt-var-toggle:hover {
  text-decoration: underline;
}

.cs-prompt-var-list {
  margin-top: 8px;
  padding: 10px;
  background: #f9fafb;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cs-prompt-var-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.cs-prompt-var-key {
  background: #e5e7eb;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 11px;
  color: #374151;
  white-space: nowrap;
}

.cs-prompt-var-desc {
  color: #6b7280;
}

.cs-prompt-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 4px;
}

.cs-prompt-result {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
}

.cs-prompt-result.success {
  background: #f0fdf4;
  color: #16a34a;
}

.cs-prompt-result.error {
  background: #fef2f2;
  color: #dc2626;
}

.cs-prompt-actions-btns {
  display: flex;
  gap: 8px;
}

.cs-prompt-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  transition: all 0.15s;
}

.cs-prompt-btn:hover:not(:disabled) {
  background: #f9fafb;
}

.cs-prompt-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cs-prompt-btn-reset {
  color: #6b7280;
}

.cs-prompt-btn-save {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.cs-prompt-btn-save:hover:not(:disabled) {
  background: #2563eb;
}

.cs-prompt-loading {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}
</style>
