<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import type { ScriptFileMeta } from "@commandselector/shared";
import { useScriptsStore } from "../store/scripts";
import CreateScriptDialog from "./CreateScriptDialog.vue";
import ScriptEditorDialog from "./ScriptEditorDialog.vue";

const emit = defineEmits<{
  (e: "close"): void;
  (e: "import-command", command: any): void;
}>();

const {
  scripts,
  loadScripts,
  deleteScript,
  exportScript,
  getScriptContent
} = useScriptsStore();

const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const editingScript = ref<ScriptFileMeta | null>(null);

const searchKeyword = ref("");
const selectedType = ref<"all" | "bat" | "ps1">("all");

const isLoading = ref(false);
const errorMsg = ref("");
const isDeleting = ref<string | null>(null);
const isExporting = ref<string | null>(null);
const isImportingCommand = ref<string | null>(null);

const filteredScripts = computed(() => {
  let result = scripts.value;

  if (selectedType.value !== "all") {
    result = result.filter((s) => s.type === selectedType.value);
  }

  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase();
    result = result.filter((s) =>
      s.name.toLowerCase().includes(keyword) ||
      (s.description?.toLowerCase().includes(keyword) ?? false)
    );
  }

  return result.sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
});

const stats = computed(() => {
  const batCount = scripts.value.filter((s) => s.type === "bat").length;
  const ps1Count = scripts.value.filter((s) => s.type === "ps1").length;
  return { batCount, ps1Count, total: scripts.value.length };
});

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

function openCreateDialog() {
  showCreateDialog.value = true;
}

function closeCreateDialog() {
  showCreateDialog.value = false;
}

async function handleCreateScript(name: string, type: "bat" | "ps1", content: string, description?: string) {
  try {
    const { createScript } = useScriptsStore();
    await createScript(name, type, content, description);
    await handleLoadScripts();
    closeCreateDialog();
  } catch (e: any) {
    alert(`创建失败: ${e.message}`);
  }
}

function openEditDialog(script: ScriptFileMeta) {
  editingScript.value = script;
  showEditDialog.value = true;
}

function closeEditDialog() {
  showEditDialog.value = false;
  editingScript.value = null;
}

async function handleSaveScript(id: string, content: string) {
  try {
    const { updateScript } = useScriptsStore();
    await updateScript(id, content);
    await handleLoadScripts();
    closeEditDialog();
  } catch (e: any) {
    alert(`保存失败: ${e.message}`);
  }
}

async function handleDeleteScript(script: ScriptFileMeta) {
  if (!confirm(`确定要删除脚本 "${script.name}" 吗?`)) {
    return;
  }
  isDeleting.value = script.id;
  try {
    await deleteScript(script.id);
    await handleLoadScripts();
  } catch (e: any) {
    alert(`删除失败: ${e.message}`);
  } finally {
    isDeleting.value = null;
  }
}

async function handleImportScript() {
  try {
    const { importScript } = useScriptsStore();
    await importScript();
    await handleLoadScripts();
  } catch (e: any) {
    alert(`导入失败: ${e.message}`);
  }
}

async function handleExportScript(script: ScriptFileMeta) {
  isExporting.value = script.id;
  try {
    await exportScript(script.id);
    alert("导出成功");
  } catch (e: any) {
    alert(`导出失败: ${e.message}`);
  } finally {
    isExporting.value = null;
  }
}

async function handleImportAsCommand(script: ScriptFileMeta) {
  isImportingCommand.value = script.id;
  try {
    const content = await getScriptContent(script.id);
    const command = {
      id: `cmd-${Date.now()}`,
      name: script.name,
      description: script.description || `从 ${script.type.toUpperCase()} 脚本导入`,
      category: "批处理脚本",
      tags: [script.type.toUpperCase()],
      engine: script.type === "bat" ? "cmd" : "cmd+powershell",
      template: script.type === "bat" ? content : "",
      powershellTemplate: script.type === "ps1" ? content : undefined,
      params: [],
      platform: "windows",
      usage: "",
      updatedAt: script.updatedAt
    };
    emit("import-command", command);
    alert("命令已导入");
  } catch (e: any) {
    alert(`导入失败: ${e.message}`);
  } finally {
    isImportingCommand.value = null;
  }
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === "Escape") {
    if (showEditDialog.value) {
      closeEditDialog();
    } else if (showCreateDialog.value) {
      closeCreateDialog();
    } else {
      emit("close");
    }
  }
}

onMounted(() => {
  handleLoadScripts();
  window.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
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
          <div class="cs-toolbar">
            <div class="cs-toolbar-left">
              <button class="cs-btn cs-btn-primary" type="button" @click="openCreateDialog">
                新建脚本
              </button>
              <button class="cs-btn cs-btn-outline" type="button" @click="handleImportScript">
                导入
              </button>
            </div>
            <div class="cs-toolbar-right">
              <input v-model="searchKeyword" class="cs-input" placeholder="搜索脚本..." />
              <div class="cs-filter-buttons">
                <button
                  class="cs-filter-btn"
                  :class="{ active: selectedType === 'all' }"
                  type="button"
                  @click="selectedType = 'all'"
                >
                  全部 ({{ stats.total }})
                </button>
                <button
                  class="cs-filter-btn"
                  :class="{ active: selectedType === 'bat' }"
                  type="button"
                  @click="selectedType = 'bat'"
                >
                  BAT ({{ stats.batCount }})
                </button>
                <button
                  class="cs-filter-btn"
                  :class="{ active: selectedType === 'ps1' }"
                  type="button"
                  @click="selectedType = 'ps1'"
                >
                  PS1 ({{ stats.ps1Count }})
                </button>
              </div>
            </div>
          </div>

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
              <div class="cs-script-icon">{{ script.type === "ps1" ? "PS" : "BAT" }}</div>
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
                <button class="cs-action-btn" title="导入为命令" type="button" :disabled="isImportingCommand === script.id" @click="handleImportAsCommand(script)">📋</button>
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
      @save="handleSaveScript"
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

.cs-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.cs-toolbar-left, .cs-toolbar-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

.cs-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid;
}

.cs-btn-primary {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.cs-btn-primary:hover:not(:disabled) {
  background: #2563eb;
  border-color: #2563eb;
}

.cs-btn-outline {
  background: white;
  color: #374151;
  border-color: #d1d5db;
}

.cs-btn-outline:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.cs-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cs-input {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.cs-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.cs-filter-buttons {
  display: flex;
  gap: 4px;
}

.cs-filter-btn {
  padding: 4px 8px;
  border: none;
  background: transparent;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  border-radius: 4px;
}

.cs-filter-btn.active {
  background: #dbeafe;
  color: #1d4ed8;
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

.cs-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
}
</style>
