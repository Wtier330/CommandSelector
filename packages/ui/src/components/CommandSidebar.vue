<script setup lang="ts">
import { ref } from "vue";
import type { CommandEntry } from "@commandselector/shared";
import CategoryMultiSelect from "./CategoryMultiSelect.vue";

defineProps<{
  categories: string[];
  filteredCommands: CommandEntry[];
  selectedId: string | null;
  keyword: string;
  selectedCategories: string[];
  trashedCommands?: CommandEntry[];
}>();

const emit = defineEmits<{
  (e: "update:keyword", value: string): void;
  (e: "update:selectedCategories", value: string[]): void;
  (e: "select", id: string): void;
  (e: "create"): void;
  (e: "import", command: CommandEntry): void;
  (e: "restore-trash", id: string): void;
  (e: "delete-permanently", id: string): void;
  (e: "empty-trash"): void;
}>();

// 导入弹窗状态
const showImportDialog = ref(false);
const importJsonText = ref("");
const importError = ref("");

function selectCommand(id: string) {
  emit("select", id);
}

function openImportDialog() {
  showImportDialog.value = true;
  importJsonText.value = "";
  importError.value = "";
}

function closeImportDialog() {
  showImportDialog.value = false;
  importJsonText.value = "";
  importError.value = "";
}

function handleImport() {
  const text = importJsonText.value.trim();
  if (!text) {
    importError.value = "请输入命令的 JSON 内容";
    return;
  }

  try {
    const parsed = JSON.parse(text);

    // 基础格式校验
    if (!parsed.name || typeof parsed.name !== "string") {
      importError.value = "缺少必填字段: name（命令名称）";
      return;
    }
    if (!parsed.template || typeof parsed.template !== "string") {
      importError.value = "缺少必填字段: template（命令模板）";
      return;
    }
    if (!parsed.id || typeof parsed.id !== "string") {
      importError.value = "缺少必填字段: id（命令ID）";
      return;
    }

    // 确保有默认值
    const command: CommandEntry = {
      id: parsed.id,
      name: parsed.name,
      template: parsed.template,
      description: parsed.description || "",
      category: parsed.category || "",
      engine: parsed.engine || "cmd",
      platform: parsed.platform || "windows",
      params: parsed.params || [],
      tags: parsed.tags || [],
      usage: parsed.usage || ""
    };

    emit("import", command);
    closeImportDialog();
  } catch (e) {
    importError.value = "JSON 格式错误: " + (e as Error).message;
  }
}
</script>

<template>
  <div class="cs-sidebar-content">
    <div class="cs-search">
      <span class="cs-search-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" stroke-width="2" />
          <path d="M16.2 16.2 21 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </span>
      <input
        class="cs-input"
        placeholder="搜索命令 (Ctrl+/)"
        :value="keyword"
        @input="emit('update:keyword', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="cs-section">
      <div class="cs-section-title">分类</div>
      <CategoryMultiSelect
        :categories="categories"
        :model-value="selectedCategories"
        @update:model-value="emit('update:selectedCategories', $event)"
      />
    </div>

    <div class="cs-section cs-list-section">
      <div class="cs-section-header">
        <div class="cs-section-title">命令</div>
        <div class="cs-command-count">{{ filteredCommands.length }} 条</div>
        <div class="cs-sidebar-actions">
          <button
            class="cs-btn cs-btn-primary cs-btn-sm"
            type="button"
            @click="$emit('create')"
          >
            添加
          </button>
          <button
            class="cs-btn cs-btn-outline cs-btn-sm"
            type="button"
            @click="openImportDialog"
          >
            导入
          </button>
        </div>
      </div>
    </div>

    <div class="cs-list">
      <button
        v-for="c in filteredCommands"
        :key="c.id"
        class="cs-item"
        :class="{ 'is-selected': selectedId === c.id }"
        type="button"
        @click="selectCommand(c.id)"
      >
        <div class="cs-item-top">
          <div class="cs-item-title">{{ c.name }}</div>
          <span v-if="c.engine" class="cs-badge">
            {{ c.engine === 'cmd' ? 'CMD' : 'PS' }}
          </span>
        </div>
        <div v-if="c.description" class="cs-item-desc">{{ c.description }}</div>
      </button>
    </div>
  </div>

  <!-- 导入对话框 -->
  <div v-if="showImportDialog" class="cs-dialog-overlay" @click.self="closeImportDialog">
    <div class="cs-dialog">
      <div class="cs-dialog-header">
        <div class="cs-dialog-title">导入命令</div>
        <button class="cs-dialog-close" type="button" @click="closeImportDialog">&times;</button>
      </div>
      <div class="cs-dialog-body">
        <div class="cs-dialog-desc">请粘贴命令的 JSON 内容：</div>
        <textarea
          v-model="importJsonText"
          class="cs-input cs-textarea"
          rows="10"
          :class="{ 'cs-textarea-xl': true }"
          placeholder='{\n  "id": "example-cmd",\n  "name": "示例命令",\n  "template": "ping {{target}}",\n  "description": "描述",\n  "category": "分类",\n  "params": []\n}'
        ></textarea>
        <div v-if="importError" class="cs-dialog-error">{{ importError }}</div>
      </div>
      <div class="cs-dialog-footer">
        <button class="cs-btn cs-btn-outline" type="button" @click="closeImportDialog">取消</button>
        <button class="cs-btn cs-btn-primary" type="button" @click="handleImport">确定</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import "../styles/sidebar.css";

.cs-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.cs-dialog {
  background: white;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.cs-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.cs-dialog-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.cs-dialog-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
}

.cs-dialog-close:hover {
  background: #f3f4f6;
}

.cs-dialog-body {
  padding: 20px;
}

.cs-dialog-desc {
  margin-bottom: 8px;
  color: #374151;
  font-size: 14px;
}

.cs-textarea {
  width: 100%;
  font-family: "Consolas", "Monaco", monospace;
  font-size: var(--cs-textarea-font-size, 13px);
  min-height: var(--cs-textarea-min-height, 96px);
  max-height: var(--cs-textarea-max-height, 480px);
  line-height: var(--cs-textarea-line-height, 1.5);
  padding: var(--cs-textarea-padding-y, 10px) var(--cs-textarea-padding-x, 12px);
  resize: vertical;
  border: 1px solid var(--cs-border, #e5e7eb);
  border-radius: 6px;
  background: #f8fafc;
  color: var(--cs-text, #0f172a);
  box-sizing: border-box;
  overflow-y: auto;
  transition: all 0.2s ease;
}

.cs-textarea:focus {
  background: #fff;
  border-color: var(--cs-blue-200, #bfdbfe);
  outline: none;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.cs-textarea::-webkit-scrollbar {
  width: 8px;
}

.cs-textarea::-webkit-scrollbar-track {
  background: transparent;
}

.cs-textarea::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.cs-textarea::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.cs-dialog-error {
  margin-top: 12px;
  padding: 10px 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #dc2626;
  font-size: 13px;
}

.cs-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
}
</style>
