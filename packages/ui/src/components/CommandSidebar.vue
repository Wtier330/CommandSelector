<script setup lang="ts">
import { ref } from "vue";
import type { CommandEntry, ScriptFileMeta, ScriptType } from "@commandselector/shared";
import CategoryMultiSelect from "./CategoryMultiSelect.vue";
import CategoryManageDialog from "./CategoryManageDialog.vue";
import ModeSwitcher from "./ModeSwitcher.vue";

type ScriptTypeFilter = 'all' | ScriptType;

defineProps<{
  categories: string[];
  filteredCommands: CommandEntry[];
  scripts: ScriptFileMeta[];
  selectedId: string | null;
  keyword: string;
  selectedCategories: string[];
  trashedCommands?: CommandEntry[];
  mode: 'command' | 'script';
  selectedScriptType?: ScriptTypeFilter;
}>();

const emit = defineEmits<{
  (e: "update:keyword", value: string): void;
  (e: "update:selectedCategories", value: string[]): void;
  (e: "update:mode", value: 'command' | 'script'): void;
  (e: "select", id: string): void;
  (e: "create"): void;
  (e: "import", command: CommandEntry): void;
  (e: "restore-trash", id: string): void;
  (e: "delete-permanently", id: string): void;
  (e: "empty-trash"): void;
  (e: "add-category", category: string): void;
  (e: "delete-category", category: string, action: "move" | "clear", targetCategory?: string): void;
  (e: "update:selectedScriptType", value: ScriptTypeFilter): void;
  (e: "open-script-manage"): void;
}>();

// 导入弹窗状态
const showImportDialog = ref(false);
const importJsonText = ref("");
const importError = ref("");

// 分类管理弹窗状态
const showCategoryManage = ref(false);

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

function openCategoryManage() {
  showCategoryManage.value = true;
}

function closeCategoryManage() {
  showCategoryManage.value = false;
}

function handleAddCategory(category: string) {
  emit("add-category", category);
}

function handleDeleteCategory(category: string, action: "move" | "clear", targetCategory?: string) {
  emit("delete-category", category, action, targetCategory);
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

// 脚本类型配置
const scriptTypeConfig = {
  all: { label: '全部', color: '#6b7280' },
  bat: { label: 'BAT', color: '#4d4d4d' },
  ps1: { label: 'PowerShell', color: '#2b579a' },
  vbs: { label: 'VBS', color: '#8b4513' },
  sh: { label: 'Shell', color: '#2e8b57' },
  cmd: { label: 'CMD', color: '#6b7280' },
  py: { label: 'Python', color: '#3776ab' }
};

// 所有类型选项
const allScriptTypes = ['all', 'bat', 'ps1', 'vbs', 'sh', 'cmd', 'py'] as const;

// 下拉菜单状态
const showScriptTypeDropdown = ref(false);

function handleScriptTypeChange(type: typeof allScriptTypes[number]) {
  emit('update:selectedScriptType', type);
  showScriptTypeDropdown.value = false;
}

function toggleScriptTypeDropdown(e: MouseEvent) {
  e.stopPropagation();
  showScriptTypeDropdown.value = !showScriptTypeDropdown.value;
}

function closeScriptTypeDropdown() {
  showScriptTypeDropdown.value = false;
}

function handleOpenScriptManage() {
  emit('open-script-manage');
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
        :placeholder="mode === 'script' ? '搜索脚本...' : '搜索命令 (Ctrl+/)'"
        :value="keyword"
        @input="emit('update:keyword', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <!-- 模式切换器 -->
    <div class="cs-mode-wrapper">
      <ModeSwitcher :model-value="mode" @update:model-value="emit('update:mode', $event)" />
    </div>

    <!-- 命令库界面 -->
    <template v-if="mode === 'command'">
      <div class="cs-section">
        <div class="cs-section-header">
          <div class="cs-section-title">分类</div>
          <button
            class="cs-btn cs-btn-icon cs-btn-ghost"
            type="button"
            title="管理分类"
            @click="openCategoryManage"
          >
            <svg t="1776216985874" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5567" width="16" height="16"><path d="M642.8 165.6c3.5 0 6.8 0.9 9.9 2.7l86.6 50c5.9 3.4 8.3 8.5 9.3 12.1 1 3.7 1.4 9.2-2 15.2l-21.4 37.1c-15.3 26.4-14.2 59.2 2.9 84.6 6.4 9.5 12.2 19.6 17.4 30 13.5 27.3 41.3 44.7 71.8 44.7H860c11 0 20 9 20 20v100c0 11-9 20-20 20h-42.8c-30.5 0-58.3 17.3-71.8 44.7-5.1 10.4-11 20.5-17.4 30-17 25.3-18.1 58.2-2.9 84.6l21.4 37.1c5.5 9.6 2.2 21.8-7.3 27.3l-86.6 50c-3.1 1.8-6.4 2.7-9.9 2.7-2.7 0-12-0.7-17.4-10l-21.4-37.1a79.95 79.95 0 0 0-69.3-40c-1.7 0-3.5 0.1-5.3 0.2-6 0.4-11.9 0.6-17.4 0.6-5.5 0-11.4-0.2-17.4-0.6-1.8-0.1-3.5-0.2-5.3-0.2-28.4 0-54.9 15.1-69.3 40l-21.4 37.1c-5.4 9.3-14.7 10-17.4 10-3.5 0-6.8-0.9-9.9-2.7l-86.6-50c-9.6-5.5-12.8-17.8-7.3-27.3l21.4-37.1c15.3-26.4 14.2-59.2-2.9-84.6-6.4-9.5-12.2-19.6-17.4-30-13.5-27.3-41.3-44.7-71.8-44.7H164c-11 0-20-9-20-20V462c0-11 9-20 20-20h42.8c30.5 0 58.3-17.3 71.8-44.7 5.1-10.4 11-20.5 17.4-30 17-25.3 18.1-58.2 2.9-84.6l-21.4-37.1c-3.4-5.9-3-11.5-2-15.2 1-3.7 3.4-8.7 9.3-12.1l86.6-50c3.1-1.8 6.4-2.7 9.9-2.7 2.7 0 12.1 0.7 17.4 10l21.4 37.1c14.4 24.9 40.8 40 69.3 40 1.7 0 3.5-0.1 5.3-0.2 6-0.4 11.9-0.6 17.4-0.6 5.5 0 11.4 0.2 17.4 0.6 1.8 0.1 3.5 0.2 5.3 0.2 28.4 0 54.9-15.1 69.3-40l21.4-37.1c5.2-9.3 14.6-10 17.3-10m0-80c-34.6 0-68.2 17.9-86.7 50l-21.4 37.1c-7.5-0.5-15-0.8-22.7-0.8-7.6 0-15.2 0.3-22.6 0.8L468 135.6c-18.5-32.1-52.1-50-86.7-50-17 0-34.2 4.3-49.9 13.4l-86.6 50c-47.8 27.6-64.2 88.8-36.6 136.6l21.4 37.1c-8.4 12.5-16 25.6-22.7 39.3H164c-55.2 0-100 44.8-100 100v100c0 55.2 44.8 100 100 100h42.8c6.7 13.6 14.3 26.7 22.7 39.3l-21.4 37.1c-27.6 47.8-11.2 109 36.6 136.6l86.6 50c15.7 9.1 32.9 13.4 49.9 13.4 34.6 0 68.2-17.9 86.7-50l21.4-37.1c7.5 0.5 15 0.8 22.6 0.8 7.6 0 15.2-0.3 22.7-0.8l21.4 37.1c18.5 32.1 52.1 50 86.7 50 17 0 34.2-4.3 49.9-13.4l86.6 50c47.8-27.6 64.2-88.8 36.6-136.6l-21.4-37.1c8.4-12.5 16-25.6 22.7-39.3H860c55.2 0 100-44.8 100-100V462c0-55.2-44.8-100-100-100h-42.8c-6.7-13.6-14.3-26.7-22.7-39.3l21.4-37.1c27.6-47.8 11.2-109-36.6-136.6l-86.6-50c-15.7-9.1-32.9-13.4-49.9-13.4z" fill="#4a5fe2" p-id="5568"></path><path d="M512 442c38.6 0 70 31.4 70 70s-31.4 70-70 70-70-31.4-70-70 31.4-70 70-70m0-80c-82.8 0-150 67.2-150 150s67.2 150 150 150 150-67.2 150-150150-67.2-150-150-150z" fill="#7c44e2" p-id="5569"></path></svg>
          </button>
        </div>
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
          </div>
          <div v-if="c.description" class="cs-item-desc">{{ c.description }}</div>
        </button>
      </div>
    </template>

    <!-- 脚本库界面 -->
    <template v-else-if="mode === 'script'">
      <div class="cs-section cs-list-section">
        <div class="cs-section-header">
          <div class="cs-section-title">功能</div>
          <div class="cs-script-count">{{ scripts.length }} 个</div>
        </div>

        <!-- 脚本类型过滤 -->
        <div class="cs-script-type-dropdown" @click.stop>
          <button
            class="cs-dropdown-trigger"
            :class="{ active: showScriptTypeDropdown }"
            type="button"
            @click="toggleScriptTypeDropdown"
          >
            <span class="cs-dropdown-dot" :style="{ background: scriptTypeConfig[selectedScriptType as keyof typeof scriptTypeConfig]?.color }"></span>
            {{ scriptTypeConfig[selectedScriptType as keyof typeof scriptTypeConfig]?.label }}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
          <div v-if="showScriptTypeDropdown" class="cs-dropdown-menu">
            <button
              v-for="type in allScriptTypes"
              :key="type"
              class="cs-dropdown-item"
              :class="{ active: selectedScriptType === type }"
              type="button"
              @click="handleScriptTypeChange(type)"
            >
              <span class="cs-dropdown-dot" :style="{ background: scriptTypeConfig[type].color }"></span>
              {{ scriptTypeConfig[type].label }}
            </button>
          </div>
        </div>

        <!-- 管理按钮 -->
        <button
          class="cs-btn cs-btn-outline cs-btn-sm cs-manage-btn"
          type="button"
          @click="handleOpenScriptManage"
        >
          管理
        </button>
      </div>
    </template>
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
  <!-- 分类管理对话框 -->
  <CategoryManageDialog
    v-if="showCategoryManage"
    :categories="categories"
    :commands="filteredCommands"
    @close="closeCategoryManage"
    @add="handleAddCategory"
    @delete="handleDeleteCategory"
  />
</template>

<style scoped>
@import "../styles/sidebar.css";

.cs-mode-wrapper {
  margin-bottom: 16px;
}

.cs-script-count {
  font-size: 13px;
  color: #87867f;
}

/* 脚本类型过滤 */
.cs-script-type-dropdown {
  position: relative;
  margin-bottom: 12px;
}

.cs-dropdown-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e8e6dc;
  border-radius: 8px;
  background: #faf9f5;
  color: #5e5d59;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cs-dropdown-trigger:hover {
  border-color: #d1d5db;
}

.cs-dropdown-trigger.active {
  border-color: #3898ec;
  background: #eff6ff;
}

.cs-dropdown-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.cs-dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e8e6dc;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
  padding: 6px;
}

.cs-dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #5e5d59;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.cs-dropdown-item:hover {
  background: #f3f4f6;
}

.cs-dropdown-item.active {
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 500;
}

.cs-manage-btn {
  width: 100%;
}

.cs-btn-icon {
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.cs-btn-ghost {
  background: transparent;
  border: 1px solid transparent;
  color: #5e5d59;
}

.cs-btn-ghost:hover {
  background: #e8e6dc;
  border-color: #e8e6dc;
}

.cs-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(20, 20, 19, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.cs-dialog {
  background: #faf9f5;
  border: 1px solid #f0eee6;
  border-radius: 12px;
  width: 520px;
  max-width: 90%;
  box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.08);
}

.cs-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e8e6dc;
}

.cs-dialog-title {
  font-family: "Georgia", serif;
  font-size: 20px;
  font-weight: 500;
  color: #141413;
}

.cs-dialog-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  font-size: 24px;
  color: #5e5d59;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.25s ease;
}

.cs-dialog-close:hover {
  background: #e8e6dc;
}

.cs-dialog-body {
  padding: 24px;
}

.cs-dialog-desc {
  margin-bottom: 12px;
  color: #5e5d59;
  font-size: 15px;
}

.cs-textarea {
  width: 100%;
  font-family: "Consolas", "Monaco", monospace;
  font-size: 13px;
  line-height: 1.60;
  padding: 12px;
  resize: vertical;
  border: 1px solid #e8e6dc;
  border-radius: 12px;
  background: #faf9f5;
  color: #141413;
  box-sizing: border-box;
  overflow-y: auto;
  transition: all 0.25s ease;
}

.cs-textarea:focus {
  background: #ffffff;
  border-color: #3898ec;
  outline: none;
  box-shadow: 0 0 0 3px rgba(56, 152, 236, 0.1);
}

.cs-textarea::-webkit-scrollbar {
  width: 8px;
}

.cs-textarea::-webkit-scrollbar-track {
  background: transparent;
}

.cs-textarea::-webkit-scrollbar-thumb {
  background: #d1cfc5;
  border-radius: 4px;
}

.cs-textarea::-webkit-scrollbar-thumb:hover {
  background: #c2c0b6;
}

.cs-dialog-error {
  margin-top: 12px;
  padding: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #b53333;
  font-size: 14px;
}

.cs-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e8e6dc;
}
</style>
