<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { ScriptFileMeta, ScriptType } from "@commandselector/shared";
import { useScriptsStore } from "../store/scripts";
import { useKeyboardShortcuts } from "@commandselector/ui";
import { useScriptFilters } from "../composables/useScriptFilters";
import CreateScriptDialog from "./CreateScriptDialog.vue";
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
const { keyword, selectedType, filteredScripts, stats } = useScriptFilters(scripts);

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
    await createScript(name, type, content, description);
    await handleLoadScripts();
    closeCreateDialog();
  } catch (e: any) {
    alert(`创建失败: ${e.message}`);
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
    alert(`删除失败: ${e.message}`);
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
    alert(`导入导入: ${e.message}`);
  }
}

async function handleExportScript(script: ScriptFileMeta) {
  isExporting.value = script.id;
  try {
    const result = await exportScript(script.id);
    if (result) {
      alert("导出成功");
    }
  } catch (e: any) {
    alert(`导出失败: ${e.message}`);
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
            @create="openCreateDialog"
            @import="handleImportScript"
            @update:keyword="keyword = $event"
            @update:selectedType="selectedType = $event"
          />

          <div v-if="isLoading" class="cs-loading-state">正在加载...</div>
          <div v-else-if="errorMsg" class="cs-error-state">
            <div>{{ errorMsg }}</div>
            <button class="cs-btn" type="button" @click="handleLoadScripts">重试</button>
          </div>
          <div v-else-if="filteredScripts.length === 0" class="cs-empty-state">
            暂无脚本
          </div>
          <div v-else class="cs-script-list">
            <div v-for="script in filteredScripts" :key="script.id" class="cs-script-item">
              <div class="cs-script-icon">{{ script.type === 'ps1' ? "PS" : "BAT" }}</div>
              <div class="cs-script-info">
                <div class="cs-script-name">{{ script.name }}</div>
                <div class="cs-script-meta">
                  <span>{{ formatSize(script.size) }}</span>
                  <span>{{ formatTime(script.updatedAt) }}</span>
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
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.cs-dialog {
  background: white;
  border-radius: 8px;
  width: 800px;
  max-width: 95%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
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
}

.cs-dialog-close:hover {
  background: #f3f4f6;
}

.cs-dialog-body {
  padding: 16px 20px;
  overflow-y: auto;
  flex: 1;
}

.cs-loading-state, .cs-error-state, .cs-empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #6b7280;
}

.cs-script-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cs-script-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.cs-script-item:hover {
  background: #f9fafb;
}

.cs-script-icon {
  width: 50px;
  padding: 8px;
  background: #f3f4f6;
  border-radius: 4px;
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
}

.cs-script-info {
  flex: 1;
}

.cs-script-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.cs-script-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #6b7280;
}

.cs-script-actions {
  display: flex;
  gap: 4px;
}

.cs-action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
}

.cs-action-btn:hover:not(:disabled) {
  background: #e5e7eb;
}

.cs-action-delete:hover:not(:disabled) {
  background: #fee2e2;
}

.cs-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cs-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
}

.cs-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid;
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
</style>
