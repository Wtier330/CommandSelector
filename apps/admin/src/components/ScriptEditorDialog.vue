<script setup lang="ts">
import { ref, computed, watch } from "vue";
import MonacoEditor from "./MonacoEditor.vue";
import ScriptMetadataPanel from "./ScriptMetadataPanel.vue";
import ScriptEditorActions from "./ScriptEditorActions.vue";
import {
  useScriptMetadata,
  useScriptTemplates,
  useKeyboardShortcuts
} from "@commandselector/ui";

const props = defineProps<{
  scriptId: string;
  scriptName: string;
  scriptType: "bat" | "ps1";
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "save", id: string, content: string): void;
}>();

const scriptContent = ref("");
const scriptType = ref(props.scriptType);
const isLoading = ref(true);
const errorMsg = ref("");

// 使用 composables
const { metadata, metadataStatus } = useScriptMetadata(scriptContent, scriptType);
const { hasChanges, insertCommentTemplate, setChanged } = useScriptTemplates(scriptContent, scriptType);

// Monaco 语言
const monacoLanguage = computed(() => {
  return props.scriptType === "ps1" ? "powershell" : "batch";
});

// 加载脚本内容
async function loadScriptContent() {
  isLoading.value = true;
  errorMsg.value = "";
  try {
    const { getScriptContent } = await import("../store/scripts");
    scriptContent.value = await getScriptContent(props.scriptId);
    setChanged(false);
  } catch (e: any) {
    errorMsg.value = `加载失败: ${e.message}`;
  } finally {
    isLoading.value = false;
  }
}

// 处理保存
function handleSave() {
  emit("save", props.scriptId, scriptContent.value);
}

// 处理内容变化
function handleContentChange(value: string) {
  scriptContent.value = value;
  setChanged(true);
}

// 键盘快捷键
useKeyboardShortcuts({
  onSave: handleSave,
  onClose: () => emit("close"),
  onInsertTemplate: insertCommentTemplate,
  hasChanges: hasChanges
});

// 监听 props 变化
watch(() => props.scriptType, (newType) => {
  scriptType.value = newType;
});

// 初始化加载
loadScriptContent();
</script>

<template>
  <teleport to="body">
    <div class="cs-dialog-overlay" @click.self="hasChanges ? undefined : emit('close')">
      <div class="cs-dialog">
        <div class="cs-dialog-header">
          <div class="cs-dialog-title">
            {{ scriptName }}
            <span v-if="hasChanges" class="cs-unsaved-indicator">●</span>
          </div>
          <ScriptEditorActions
            :has-changes="hasChanges"
            @insert-template="insertCommentTemplate"
            @save="handleSave"
            @close="emit('close')"
          />
        </div>

        <div class="cs-dialog-body">
          <div v-if="isLoading" class="cs-loading-state">正在加载脚本内容...</div>
          <div v-else-if="errorMsg" class="cs-error-state">{{ errorMsg }}</div>
          <div v-else class="cs-editor-layout">
            <ScriptMetadataPanel
              :metadata="metadata"
              :metadata-status="metadataStatus"
              @insert-template="insertCommentTemplate"
            />

            <div class="cs-editor-section">
              <div class="cs-editor-header">
                <div class="cs-editor-title">脚本内容</div>
                <div class="cs-editor-info">
                  <span class="cs-editor-type">{{ scriptType === 'ps1' ? 'PowerShell' : 'BAT' }}</span>
                </div>
              </div>
              <MonacoEditor
                v-model="scriptContent"
                :language="monacoLanguage"
                @update:model-value="handleContentChange"
              />
            </div>
          </div>
        </div>

        <div class="cs-dialog-footer">
          <button class="cs-btn cs-btn-outline" type="button" @click="emit('close')">
            {{ hasChanges ? '取消' : '关闭' }}
          </button>
          <button class="cs-btn cs-btn-primary" type="button" @click="handleSave">
            保存
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
/* 确保 overlay 不阻止鼠标事件 */
.cs-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.cs-dialog {
  background: white;
  border-radius: 12px;
  width: 1000px;
  max-width: 95%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  position: relative;
}

.cs-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.cs-dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.cs-unsaved-indicator {
  font-size: 12px;
  margin-left: 8px;
  color: #f59e0b;
}

/* 对话框主体 */
.cs-dialog-body {
  flex: 1;
  overflow-y: hidden;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 24px 24px 24px;
}

.cs-loading-state,
.cs-error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #6b7280;
}

.cs-error-state {
  color: #ef4444;
}

.cs-editor-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  overflow: hidden;
}

/* 编辑器区域 */
.cs-editor-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  overflow: hidden;
  min-height: 0;
  position: relative;
}

/* 确保 Monaco Editor 外层不拦截滚轮事件 */
.cs-editor-section > * {
  overflow: visible !important;
}

.cs-editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.cs-editor-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.cs-editor-info {
  display: flex;
  gap: 8px;
}

.cs-editor-type {
  padding: 4px 12px;
  background: #dbeafe;
  border: 1px solid #3b82f6;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  color: #3b82f6;
}

/* 底部按钮 */
.cs-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
}

.cs-btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid;
  transition: all 0.2s ease;
}

.cs-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
</style>
