<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import type { ScriptFileMeta, ScriptType } from "@commandselector/shared";
import { useScriptsStore } from "../store/scripts";
import { useKeyboardShortcuts } from "@commandselector/ui";
import { useScriptFilters } from "../composables/useScriptFilters";
import { useMessage } from "../composables/useMessage";
import CreateScriptDialog from "./CreateScriptDialog.vue";

const message = useMessage();
import ScriptEditorDialog from "./ScriptEditorDialog.vue";
import ScriptManageToolbar from "./ScriptManageToolbar.vue";
import ConfirmDialog from "./ConfirmDialog.vue";

const emit = defineEmits<{
  (e: "close"): void;
}>();

const {
  scripts,
  loadScripts,
  deleteScript,
  exportScript
} = useScriptsStore();

const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const editingScript = ref<ScriptFileMeta | null>(null);
const showConfirmDialog = ref(false);
const deletingScript = ref<ScriptFileMeta | null>(null);

const isLoading = ref(false);
const errorMsg = ref("");
const isDeleting = ref<string | null>(null);
const isExporting = ref<string | null>(null);

// 使用脚本过滤
const { keyword, selectedType, selectedSource, sourceDirs, formatSourceName, filteredScripts, stats } = useScriptFilters(scripts);

// 来源编号映射
const sourceNumberMap = computed(() => {
  const map = new Map<string, number>();
  sourceDirs.value.forEach((dir, index) => {
    map.set(dir, index + 1);
  });
  return map;
});

// 获取来源编号
function getSourceNumber(sourceDir: string | undefined): string | null {
  if (!sourceDir) return null;
  const num = sourceNumberMap.value.get(sourceDir);
  return num ? `#${num}` : null;
}

// 格式化工具
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffMinutes < 1) return "刚刚";
  if (diffMinutes < 60) return `${diffMinutes} 分钟前`;
  if (diffHours < 24) return `${diffHours} 小时前`;
  if (diffDays < 7) return `${diffDays} 天前`;
  return date.toLocaleDateString();
}

// 加载脚本
async function handleLoadScripts() {
  isLoading.value = true;
  errorMsg.value = "";
  try {
    await loadScripts();
  } catch (e: any) {
    errorMsg.value = e.message || "加载脚本失败";
  } finally {
    isLoading.value = false;
  }
}

// 对话框控制
function openCreateDialog() {
  showCreateDialog.value = true;
}

function closeCreateDialog() {
  showCreateDialog.value = false;
}

function openEditDialog(script: ScriptFileMeta) {
  editingScript.value = script;
  showEditDialog.value = true;
}

function closeEditDialog() {
  showEditDialog.value = false;
  editingScript.value = null;
}

// 脚本操作
async function handleCreateScript(name: string, type: ScriptType, content: string, description?: string) {
  try {
    const { createScript } = useScriptsStore();
    await createScript(name, type, content, description, undefined, undefined);
    await handleLoadScripts();
    closeCreateDialog();
  } catch (e: any) {
    message.error(`创建失败: ${e.message}`);
  }
}

function handleDeleteScript(script: ScriptFileMeta) {
  deletingScript.value = script;
  showConfirmDialog.value = true;
}

async function handleConfirmDelete() {
  if (!deletingScript.value) return;

  const script = deletingScript.value;
  isDeleting.value = script.id;
  try {
    await deleteScript(script.id);
    await handleLoadScripts();
  } catch (e: any) {
    message.error(`删除失败: ${e.message}`);
  } finally {
    isDeleting.value = null;
    showConfirmDialog.value = false;
    deletingScript.value = null;
  }
}

function handleCancelDelete() {
  showConfirmDialog.value = false;
  deletingScript.value = null;
}

async function handleImportScript() {
  try {
    const { importScript } = useScriptsStore();
    await importScript();
    await handleLoadScripts();
  } catch (e: any) {
    message.error(`导入导入: ${e.message}`);
  }
}

async function handleExportScript(script: ScriptFileMeta) {
  isExporting.value = script.id;
  try {
    const result = await exportScript(script.id);
    if (result) {
      message.success("导出成功");
    }
  } catch (e: any) {
    message.error(`导出失败: ${e.message}`);
  } finally {
    isExporting.value = null;
  }
}

// 键盘快捷键
useKeyboardShortcuts({
  onSave: () => {}, // 禁用保存快捷键
  onClose: () => {
    if (showEditDialog.value) {
      closeEditDialog();
    } else if (showCreateDialog.value) {
      closeCreateDialog();
    } else {
      emit("close");
    }
  }
});

onMounted(() => {
  handleLoadScripts();
});
</script>

<template>
  <teleport to="body">
    <div class="cs-dialog-overlay" @click.self="emit('close')">
      <div class="cs-dialog">
        <div class="cs-dialog-header">
          <div class="cs-dialog-title">管理批处理脚本</div>
          <button class="cs-dialog-close" type="button" @click="emit('close')">&times;</button>
</div>

        <div class="cs-dialog-body">
          <ScriptManageToolbar
            :stats="stats"
            :sourceDirs="sourceDirs"
            :formatSourceName="formatSourceName"
            @create="openCreateDialog"
            @import="handleImportScript"
            @update:keyword="keyword = $event"
            @update:selectedType="selectedType = $event"
            @update:selectedSource="selectedSource = $event"
          />

          <div v-if="isLoading" class="cs-loading-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 6v6l4 2"></path>
            </svg>
            <div>正在加载脚本...</div>
          </div>
          <div v-else-if="errorMsg" class="cs-error-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12" y2="16"></line>
            </svg>
            <div>{{ errorMsg }}</div>
            <button class="cs-btn cs-btn-outline" type="button" @click="handleLoadScripts">重试</button>
          </div>
          <div v-else-if="filteredScripts.length === 0" class="cs-empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <div>暂无脚本</div>
          </div>
          <div v-else class="cs-script-list">
            <div v-for="script in filteredScripts" :key="script.id" class="cs-script-item">
              <div class="cs-script-icon">{{ script.type === 'ps1' ? "PS" : "BAT" }}</div>
              <div class="cs-script-info">
                <div class="cs-script-name">{{ script.name }}</div>
                <div class="cs-script-meta">
                  <span>{{ formatSize(script.size) }}</span>
                  <span>{{ formatTime(script.updatedAt) }}</span>
                  <span v-if="getSourceNumber(script.sourceDir)" class="cs-script-source" :title="script.sourceDir">
                    来源 {{ getSourceNumber(script.sourceDir) }}
                  </span>
                </div>
              </div>
              <div class="cs-script-actions">
                <button class="cs-action-btn" title="编辑" type="button" @click="openEditDialog(script)">✏️</button>
                <button class="cs-action-btn" title="导出" type="button" :disabled="isExporting === script.id" @click="handleExportScript(script)">📤</button>
                <button class="cs-action-btn cs-action-delete" title="删除" type="button" :disabled="isDeleting === script.id" @click="handleDeleteScript(script)">🗑️</button>
              </div>
            </div>
          </div>
        </div>

        <div class="cs-dialog-footer">
          <button class="cs-btn cs-btn-outline" type="button" @click="emit('close')">关闭</button>
        </div>
      </div>
    </div>

    <CreateScriptDialog v-if="showCreateDialog" @close="closeCreateDialog" @create="handleCreateScript" />
    <ScriptEditorDialog
      v-if="showEditDialog && editingScript"
      :scriptId="editingScript.id"
      :scriptName="editingScript.name"
      :scriptType="editingScript.type"
      @close="closeEditDialog"
      @save="() => handleLoadScripts()"
    />
    <ConfirmDialog
      v-if="showConfirmDialog && deletingScript"
      title="删除脚本"
      :message="`确定要删除脚本 ${deletingScript.name} 吗？删除后无法恢复。`"
      confirmText="删除"
      cancelText="取消"
      type="danger"
      @confirm="handleConfirmDelete"
      @cancel="handleCancelDelete"
    />
  </teleport>
</template>

<style scoped>
.cs-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(20, 20, 19, 0.4);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.cs-dialog {
  background: var(--claude-ivory, white);
  border: 1px solid var(--claude-border, #e5e7eb);
  border-radius: var(--claude-radius-lg, 12px);
  width: 850px;
  max-width: 95%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.08);
}

.cs-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  border-bottom: 1px solid var(--claude-border-warm, #e5e7eb);
}

.cs-dialog-title {
  font-family: var(--claude-font-serif, system-ui);
  font-size: 18px;
  font-weight: 500;
  color: var(--claude-text-primary, #111827);
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
  color: var(--claude-text-secondary, #6b7280);
  cursor: pointer;
  border-radius: var(--claude-radius-sm, 4px);
  transition: background 0.2s;
}

.cs-dialog-close:hover {
  background: var(--claude-border-warm, #f3f4f6);
}

.cs-dialog-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}

.cs-loading-state, .cs-error-state, .cs-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
}

.cs-loading-state svg {
  animation: spin 1s linear infinite;
}

.cs-loading-state svg,
.cs-empty-state svg {
  width: 48px;
  height: 48px;
  color: var(--claude-text-tertiary, #9ca3af);
}

.cs-loading-state div,
.cs-error-state div,
.cs-empty-state div {
  font-size: 15px;
  color: var(--claude-text-secondary, #6b7280);
}

.cs-error-state {
  color: var(--claude-error, #dc2626);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.cs-script-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cs-script-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: var(--claude-parchment, #fafafa);
  border: 1px solid var(--claude-border-warm, #f0f0f0);
  border-radius: var(--claude-radius-sm, 8px);
  transition: all 0.2s ease;
}

.cs-script-item:hover {
  background: var(--claude-border-warm, #f5f5f5);
  border-color: var(--claude-text-tertiary, #e5e7eb);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.cs-script-icon {
  width: 52px;
  height: 52px;
  padding: 12px;
  background: var(--claude-ivory, white);
  border: 1px solid var(--claude-border-warm, #e5e7eb);
  border-radius: var(--claude-radius-sm, 6px);
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--claude-text-secondary, #6b7280);
  flex-shrink: 0;
}

.cs-script-info {
  flex: 1;
  min-width: 0;
}

.cs-script-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--claude-text-primary, #111827);
  margin-bottom: 6px;
  word-break: break-all;
}

.cs-script-meta {
  display: flex;
  gap: 14px;
  font-size: 12px;
  color: var(--claude-text-tertiary, #9ca3af);
  align-items: center;
  flex-wrap: wrap;
}

.cs-script-source {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: var(--claude-parchment, #f3f4f6);
  border-radius: 10px;
  color: var(--claude-text-secondary, #6b7280);
  font-size: 11px;
  font-weight: 500;
}

.cs-script-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.cs-action-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: var(--claude-radius-sm, 6px);
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--claude-parchment, #f3f4f6);
  color: var(--claude-text-secondary, #6b7280);
  transition: all 0.2s ease;
}

.cs-action-btn:hover:not(:disabled) {
  background: var(--claude-border-warm, #e5e7eb);
  color: var(--claude-text-primary, #111827);
  transform: translateY(-1px);
}

.cs-action-delete:hover:not(:disabled) {
  background: #fef2f2;
  color: #dc2626;
  border-color: #fecaca;
}

.cs-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cs-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--claude-border-warm, #e5e7eb);
  background: var(--claude-parchment, #fafafa);
  border-radius: 0 0 var(--claude-radius-lg, 12px) var(--claude-radius-lg, 12px);
}

.cs-btn {
  padding: 10px 20px;
  border-radius: var(--claude-radius-sm, 6px);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid;
  transition: all 0.2s ease;
}

.cs-btn-outline {
  background: var(--claude-ivory, white);
  color: var(--claude-text-primary, #374151);
  border-color: var(--claude-border-warm, #d1d5db);
}

.cs-btn-outline:hover {
  background: var(--claude-parchment, #f9fafb);
  border-color: var(--claude-text-tertiary, #9ca3af);
}
</style>
