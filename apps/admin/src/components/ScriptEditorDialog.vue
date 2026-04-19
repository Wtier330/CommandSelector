<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import MonacoEditor from "./MonacoEditor.vue";
import ScriptMetadataPanel from "./ScriptMetadataPanel.vue";
import ScriptEditorActions from "./ScriptEditorActions.vue";
import ConfirmDialog from "./ConfirmDialog.vue";
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
const dialogBodyRef = ref<HTMLElement>();
const showConfirmDialog = ref(false);

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

// 处理关闭
function handleClose() {
  if (hasChanges.value) {
    showConfirmDialog.value = true;
  } else {
    emit('close');
  }
}

// 确认关闭
function handleConfirmClose() {
  showConfirmDialog.value = false;
  emit('close');
}

// 取消关闭
function handleCancelClose() {
  showConfirmDialog.value = false;
}

// 处理内容变化
function handleContentChange(value: string) {
  scriptContent.value = value;
  setChanged(true);
}

// 全局滚轮处理
let globalWheelHandler: ((e: WheelEvent) => void) | null = null;

onMounted(() => {
  // 全局拦截滚轮事件
  globalWheelHandler = (e: WheelEvent) => {
    // 检查是否在对话框内
    if (dialogBodyRef.value) {
      const rect = dialogBodyRef.value.getBoundingClientRect();
      const isInDialog = e.clientX >= rect.left &&
                       e.clientX <= rect.right &&
                       e.clientY >= rect.top &&
                       e.clientY <= rect.bottom;

      if (isInDialog) {
        // 检查是否在 Monaco Editor 区域内
        const target = e.target as HTMLElement;
        const isInMonaco = target.closest('.monaco-editor-container');

        if (isInMonaco) {
          // 在 Monaco Editor 内，阻止默认滚动并让对话框主体滚动
          e.preventDefault();
          e.stopPropagation();

          // 手动滚动对话框主体
          if (dialogBodyRef.value) {
            dialogBodyRef.value.scrollTop += e.deltaY;
            dialogBodyRef.value.scrollLeft += e.deltaX;
          }
        }
      }
    }
  };

  // 使用捕获模式在全局监听
  document.addEventListener('wheel', globalWheelHandler, { passive: false, capture: true });
});

onBeforeUnmount(() => {
  if (globalWheelHandler) {
    document.removeEventListener('wheel', globalWheelHandler, { capture: true } as any);
    globalWheelHandler = null;
  }
});

// 键盘快捷键
useKeyboardShortcuts({
  onSave: handleSave,
  onClose: () => {
    // 直接关闭，不在这里检查未保存的更改
    // 检查在 handleClose 函数中进行
    if (!hasChanges.value) {
      emit('close');
    } else {
      showConfirmDialog.value = true;
    }
  },
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
    <div class="cs-dialog-overlay" @click.self="handleClose">
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
            @close="handleClose"
          />
        </div>

        <div ref="dialogBodyRef" class="cs-dialog-body">
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
          <button class="cs-btn cs-btn-outline" type="button" @click="handleClose">
            {{ hasChanges ? '取消' : '关闭' }}
          </button>
          <button class="cs-btn cs-btn-primary" type="button" @click="handleSave">
            保存
          </button>
        </div>
      </div>
    </div>

    <ConfirmDialog
      v-if="showConfirmDialog"
      title="未保存的更改"
      message="确定要关闭吗？关闭后未保存的内容将会丢失。"
      confirmText="关闭"
      cancelText="取消"
      type="warning"
      @confirm="handleConfirmClose"
      @cancel="handleCancelClose"
    />
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
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 24px 24px 24px;
  position: relative;
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
  min-width: 0;
}

/* 编辑器区域 */
.cs-editor-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
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
