<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import CodeMirrorEditor from "./CodeMirrorEditor.vue";
import ScriptMetadataPanel from "./ScriptMetadataPanel.vue";
import ScriptEditorActions from "./ScriptEditorActions.vue";
import ConfirmDialog from "./ConfirmDialog.vue";
import {
  useScriptMetadata,
  useScriptTemplates,
  useKeyboardShortcuts,
  useAIMetadata
} from "@commandselector/ui";
import type { ScriptType } from "@commandselector/shared";
import { useMessage } from "../composables/useMessage";

const message = useMessage();

const props = defineProps<{
  scriptId: string;
  scriptName: string;
  scriptType: ScriptType;
}>();

const emit = defineEmits<{
  close: [];
  save: [id: string, content: string];
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

// AI 元数据生成
const {
  isGenerating: aiGenerating,
  error: aiError,
  isConfigured: aiConfigured,
  generateMetadata,
  clearError: clearAIError,
  loadProviders,
} = useAIMetadata();

// 保存状态
const isSavingState = ref(false);

// Monaco 语言
const monacoLanguage = computed(() => {
  const map: Record<string, string> = {
    bat: "batch",
    ps1: "powershell",
    vbs: "vbscript",
    sh: "shell",
    cmd: "batch",
    py: "python"
  };
  return map[props.scriptType] || "batch";
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
async function handleSave() {
  isSavingState.value = true;

  try {
    const { updateScript } = await import("../store/scripts");
    await updateScript(props.scriptId, scriptContent.value);
    emit('save', props.scriptId, scriptContent.value);
    emit('close');
  } catch (e: any) {
    message.error(`保存失败: ${e.message}`);
  } finally {
    isSavingState.value = false;
  }
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

// 处理 AI 生成元数据
async function handleGenerateMetadata() {
  clearAIError();

  const metadata = await generateMetadata(
    scriptContent.value,
    props.scriptType as 'bat' | 'ps1' | 'vbs' | 'sh' | 'py'
  );

  if (metadata) {
    // 生成注释块
    const commentTemplate = await getCommentTemplateByType(props.scriptType, metadata);

    // 替换或插入注释块
    scriptContent.value = replaceOrInsertCommentBlock(
      scriptContent.value,
      commentTemplate,
      props.scriptType
    );
    setChanged(true);
  } else if (aiError.value) {
    message.error(`AI 生成失败: ${aiError.value.message}`);
  }
}

// 根据脚本类型获取显示名称
function getScriptTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    bat: 'BAT',
    cmd: 'CMD',
    ps1: 'PowerShell',
    vbs: 'VBScript',
    sh: 'Shell',
    py: 'Python'
  };
  return labels[type] || type.toUpperCase();
}

// 根据脚本类型获取对应的注释模板
async function getCommentTemplateByType(
  type: string,
  metadata: any
): Promise<string> {
  const {
    getBatCommentTemplateWithPlaceholder,
    getPs1CommentTemplateWithPlaceholder,
    getVbsCommentTemplateWithPlaceholder,
    getShellCommentTemplateWithPlaceholder,
    getPythonCommentTemplateWithPlaceholder
  } = await import("@commandselector/ui");

  switch (type) {
    case "bat":
    case "cmd":
      return getBatCommentTemplateWithPlaceholder(metadata);
    case "ps1":
      return getPs1CommentTemplateWithPlaceholder(metadata);
    case "vbs":
      return getVbsCommentTemplateWithPlaceholder(metadata);
    case "sh":
      return getShellCommentTemplateWithPlaceholder(metadata);
    case "py":
      return getPythonCommentTemplateWithPlaceholder(metadata);
    default:
      return getBatCommentTemplateWithPlaceholder(metadata);
  }
}

// 替换或插入注释块
function replaceOrInsertCommentBlock(
  content: string,
  newComment: string,
  type: string
): string {
  const lines = content.split('\n');
  let commentStartIndex = -1;
  let commentEndIndex = -1;

  switch (type) {
    case 'bat':
    case 'cmd': {
      // 查找 BAT 注释块 /* ... */
      const match = content.match(/\/\*\s*[\s\S]*?\*\/\s*\n?/);
      if (match) {
        return content.replace(match[0], newComment + '\n\n');
      }
      break;
    }
    case 'ps1': {
      // 查找 PowerShell 注释块 <# ... #>
      const match = content.match(/<#\s*[\s\S]*?#>\s*\n?/);
      if (match) {
        return content.replace(match[0], newComment + '\n\n');
      }
      break;
    }
    case 'vbs':
      // 查找 VBS 注释块（连续的 REM 行）
      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (trimmed.startsWith('REM') || trimmed.startsWith('rem')) {
          if (commentStartIndex === -1) {
            commentStartIndex = i;
          }
          // 检查下一行是否还是注释
          if (i < lines.length - 1 && !lines[i + 1].trim().match(/^(REM|rem)/i)) {
            commentEndIndex = i + 1;
            break;
          }
        } else if (commentStartIndex !== -1) {
          commentEndIndex = i;
          break;
        }
      }
      if (commentEndIndex === -1 && commentStartIndex !== -1) {
        commentEndIndex = lines.length;
      }
      break;
    case 'sh':
      // 查找 Shell 注释块（连续的 # 行）
      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (trimmed.startsWith('#')) {
          if (commentStartIndex === -1) {
            commentStartIndex = i;
          }
          // 检查下一行是否还是注释
          if (i < lines.length - 1 && !lines[i + 1].trim().startsWith('#')) {
            commentEndIndex = i + 1;
            break;
          }
        } else if (commentStartIndex !== -1) {
          commentEndIndex = i;
          break;
        }
      }
      if (commentEndIndex === -1 && commentStartIndex !== -1) {
        commentEndIndex = lines.length;
      }
      break;
    case 'py':
      // 查找 Python docstring """ ... """
      const pyMatch = content.match(/"""\s*[\s\S]*?\s*"""\s*\n?/);
      if (pyMatch) {
        return content.replace(pyMatch[0], newComment + '\n\n');
      }
      break;
  }

  // 如果找到注释块，替换它
  if (commentStartIndex !== -1 && commentEndIndex !== -1) {
    const before = lines.slice(0, commentStartIndex).join('\n');
    const after = lines.slice(commentEndIndex).join('\n');
    return (before ? before + '\n' : '') + newComment + '\n\n' + (after ? after : '');
  }

  // 如果没有找到注释块，在开头插入
  return newComment + '\n\n' + content;
}

onMounted(() => {
  // 加载 AI 提供商配置
  loadProviders();
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
            :is-saving="isSavingState"
            :is-generating="aiGenerating"
            :is-a-i-configured="aiConfigured"
            @insert-template="insertCommentTemplate"
            @save="handleSave"
            @close="handleClose"
            @generate-metadata="handleGenerateMetadata"
          />
        </div>

        <div ref="dialogBodyRef" class="cs-dialog-body">
          <div v-if="isLoading" class="cs-loading-state">正在加载脚本内容...</div>
          <div v-else-if="errorMsg" class="cs-error-state">{{ errorMsg }}</div>
          <div v-else-if="!isLoading && !errorMsg" class="cs-editor-layout">
            <ScriptMetadataPanel
              :metadata="metadata"
              :metadata-status="metadataStatus"
              @insert-template="insertCommentTemplate"
            />

            <div class="cs-editor-section">
              <div class="cs-editor-header">
                <div class="cs-editor-title">脚本内容</div>
                <div class="cs-editor-info">
                  <span class="cs-editor-type">{{ getScriptTypeLabel(scriptType) }}</span>
                </div>
              </div>
              <CodeMirrorEditor
                v-model="scriptContent"
                :language="monacoLanguage"
                @update:model-value="handleContentChange"
"              />
            </div>
          </div>
        </div>

        <div class="cs-dialog-footer">
          <button class="cs-btn cs-btn-outline" type="button" @click="handleClose">
            {{ hasChanges ? '取消' : '关闭' }}
          </button>
          <button
            class="cs-btn cs-btn-primary"
            type="button"
            :disabled="isSavingState"
            @click="handleSave"
          >
            {{ isSavingState ? '保存中...' : '保存' }}
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
  z-index: 3000;
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
  /* 确保编辑器不会溢出到按钮区域 */
  max-height: calc(90vh - 80px);
  /* 确保编辑器不会遮挡按钮 */
  overflow: auto;
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
  position: relative;
  /* 确保编辑器区域不会遮挡底部按钮 */
  flex-shrink: 0;
  overflow: visible;
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
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}

.cs-btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid;
  transition: all 0.2s ease;
  /* 确保按钮可点击 */
  pointer-events: auto;
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
