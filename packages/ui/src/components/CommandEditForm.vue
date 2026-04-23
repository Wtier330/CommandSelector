<script setup lang="ts">
import type { CommandEntry } from "@commandselector/shared";
import CategorySelect from "./CategorySelect.vue";

defineProps<{
  draftCommand: CommandEntry;
  categories: string[];
  templateEditMode: "cmd" | "powershell";
  isGenerating?: boolean;
  generatingStep?: string;
}>();

const emit = defineEmits<{
  (e: "update:draftCommand", value: CommandEntry): void;
  (e: "update:templateEditMode", value: "cmd" | "powershell"): void;
  (e: "cancel"): void;
  (e: "save"): void;
  (e: "ai-complete"): void;
}>();

</script>

<template>
  <div class="cs-command-edit">
    <div class="cs-command-edit-header">
      <div class="cs-command-edit-title-row">
        <h2 class="cs-command-edit-title">编辑基本信息</h2>
        <button
          class="cs-btn cs-btn-ai"
          :class="{ 'cs-btn-loading': isGenerating }"
          :disabled="isGenerating"
          @click="emit('ai-complete')"
        >
          <span v-if="isGenerating" class="cs-btn-ai-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" stroke-dasharray="31.4" stroke-dashoffset="10"/>
            </svg>
          </span>
          <span v-if="isGenerating && generatingStep" class="cs-btn-ai-step">{{ generatingStep }}</span>
          <span v-else>{{ isGenerating ? '补全中...' : 'AI 补全' }}</span>
        </button>
      </div>
      <div class="cs-command-edit-actions">
        <button class="cs-btn cs-btn-outline" @click="emit('cancel')">取消</button>
        <button class="cs-btn cs-btn-primary" @click="emit('save')">完成</button>
      </div>
    </div>

    <div class="cs-command-edit-grid">
      <label class="cs-field-col">
        <span class="cs-field-label">命令名称 <span style="color:#ef4444">*</span></span>
        <input
          :value="draftCommand.name"
          @input="emit('update:draftCommand', { ...draftCommand, name: ($event.target as HTMLInputElement).value })"
          class="cs-input cs-input-sm"
          placeholder="必填"
        />
      </label>

      <label class="cs-field-col">
        <span class="cs-field-label">分类</span>
        <CategorySelect
          :categories="categories"
          :model-value="draftCommand.category"
          @update:model-value="emit('update:draftCommand', { ...draftCommand, category: $event })"
        />
      </label>

      <label class="cs-field-col">
        <span class="cs-field-label">模板类型</span>
        <select
          :value="templateEditMode"
          @change="emit('update:templateEditMode', ($event.target as HTMLSelectElement).value as 'cmd' | 'powershell')"
          class="cs-input cs-input-sm"
        >
          <option value="cmd">仅 CMD 模板</option>
          <option value="powershell">仅 PowerShell 模板</option>
        </select>
      </label>

      <label class="cs-field-col">
        <span class="cs-field-label">适用平台</span>
        <select
          :value="draftCommand.platform"
          @change="emit('update:draftCommand', { ...draftCommand, platform: ($event.target as HTMLSelectElement).value as 'windows' | 'macos' | 'linux' | 'any' })"
          class="cs-input cs-input-sm"
        >
          <option value="windows">Windows</option>
          <option value="macos">macOS</option>
          <option value="linux">Linux</option>
          <option value="any">不限</option>
        </select>
      </label>

      <label class="cs-field-col" style="grid-column: 1 / -1;">
        <span class="cs-field-label">描述</span>
        <input
          :value="draftCommand.description"
          @input="emit('update:draftCommand', { ...draftCommand, description: ($event.target as HTMLInputElement).value })"
          class="cs-input cs-input-sm"
          placeholder="一句话描述用途"
        />
      </label>

    </div>

    <div class="cs-command-edit-template">
      <h3 class="cs-command-edit-template-title">
        {{ templateEditMode === 'cmd' ? '编辑 CMD 模板' : '编辑 PowerShell 模板' }}
        <span style="color:#ef4444">*</span>
      </h3>
      <textarea
        :value="draftCommand[templateEditMode === 'powershell' ? 'powershellTemplate' : 'template']"
        @input="emit('update:draftCommand', {
          ...draftCommand,
          [templateEditMode === 'powershell' ? 'powershellTemplate' : 'template']: ($event.target as HTMLTextAreaElement).value
        })"
        class="cs-input cs-textarea"
        rows="3"
        :placeholder="templateEditMode === 'powershell' ? '使用 {{参数名}} 作为占位符，如：Test-Path {{path}}' : '使用 {{参数名}} 作为占位符，如：ping {{target}} -n {{count}}'"
      ></textarea>
    </div>

    <div class="cs-command-edit-usage">
      <h3 class="cs-command-edit-usage-title">编辑使用说明</h3>
      <textarea
        :value="draftCommand.usage"
        @input="emit('update:draftCommand', { ...draftCommand, usage: ($event.target as HTMLTextAreaElement).value })"
        class="cs-input cs-textarea"
        rows="4"
        placeholder="补充说明或注意事项"
      ></textarea>
    </div>
  </div>
</template>

<style scoped>
.cs-command-edit {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cs-command-edit-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.cs-command-edit-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cs-command-edit-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.cs-command-edit-actions {
  display: flex;
  gap: 12px;
}

.cs-command-edit-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.cs-field-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cs-field-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.cs-command-edit-template,
.cs-command-edit-usage {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cs-command-edit-template-title,
.cs-command-edit-usage-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
}

.cs-input {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
}

.cs-input-sm {
  padding: 6px 10px;
  font-size: 13px;
}

.cs-textarea {
  resize: vertical;
  min-height: 80px;
  font-family: monospace;
}

.cs-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid;
  transition: all 0.2s ease;
}

.cs-btn-primary {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.cs-btn-primary:hover {
  background: #2563eb;
  border-color: #2563eb;
}

.cs-btn-outline {
  background: white;
  color: #374151;
  border-color: #d1d5db;
}

.cs-btn-outline:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.cs-btn-ai {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid #a855f7;
  background: #faf5ff;
  color: #a855f7;
  transition: all 0.2s ease;
}

.cs-btn-ai:hover:not(:disabled) {
  background: #f3e8ff;
  border-color: #9333ea;
}

.cs-btn-ai:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cs-btn-ai-icon {
  display: inline-flex;
  align-items: center;
  margin-right: 6px;
}

.cs-btn-ai-icon svg {
  animation: cs-spin 1s linear infinite;
}

.cs-btn-ai-step {
  font-size: 12px;
  opacity: 0.8;
}

@keyframes cs-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>