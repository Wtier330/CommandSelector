<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import MonacoEditor from "./MonacoEditor.vue";
import { parseBatComment, parsePs1Comment, type ParsedScriptMetadata } from "@commandselector/ui";
import { getBatCommentTemplate, getPs1CommentTemplate } from "@commandselector/ui";

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
const isLoading = ref(true);
const errorMsg = ref("");
const hasChanges = ref(false);

// Monaco 语言
const monacoLanguage = computed(() => {
  return props.scriptType === "ps1" ? "powershell" : "batch";
});

// 解析元数据
const metadata = computed<ParsedScriptMetadata | null>(() => {
  if (!scriptContent.value) return null;

  try {
    if (props.scriptType === "bat") {
      return parseBatComment(scriptContent.value);
    } else {
      return parsePs1Comment(scriptContent.value);
    }
  } catch {
    return null;
  }
});

// 元数据验证状态
const metadataStatus = computed(() => {
  const meta = metadata.value;

  if (!meta) {
    return {
      isValid: false,
      message: "无法解析",
      fields: {
        name: false,
        description: false,
        category: false,
        tags: false,
        usage: false,
      }
    };
  }

  const hasRequired = !meta.name || !meta.description || !meta.category;

  return {
    isValid: !hasRequired,
    message: hasRequired ? "缺少必填字段" : "注释完整",
    fields: {
      name: !!meta.name,
      description: !!meta.description,
      category: !!meta.category,
      tags: meta.tags?.length > 0,
      usage: !!meta.usage,
    }
  };
});

async function loadScriptContent() {
  isLoading.value = true;
  errorMsg.value = "";
  try {
    const { getScriptContent } = await import("../store/scripts");
    scriptContent.value = await getScriptContent(props.scriptId);
    hasChanges.value = false;
  } catch (e: any) {
    errorMsg.value = `加载失败: ${e.message}`;
  } finally {
    isLoading.value = false;
  }
}

function handleSave() {
  emit("save", props.scriptId, scriptContent.value);
}

function handleContentChange(value: string) {
  scriptContent.value = value;
  hasChanges.value = true;
}

function handleKeyDown(e: KeyboardEvent) {
  // Ctrl+Shift+D 插入注释模板
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "d") {
    e.preventDefault();
    insertCommentTemplate();
  }
  // Ctrl+S 保存
  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault();
    handleSave();
  }
  // ESC 关闭
  if (e.key === "Escape") {
    if (hasChanges.value) {
      const confirmed = confirm("有未保存的更改，确定要关闭吗？");
      if (!confirmed) return;
    }
    emit("close");
  }
}

function insertCommentTemplate() {
  const template = props.scriptType === "bat"
    ? getBatCommentTemplate()
    : getPs1CommentTemplate();

  // 在文件开头插入
  const content = scriptContent.value;
  const newContent = template + "\n\n" + content;

  scriptContent.value = newContent;
  hasChanges.value = true;
}

onMounted(() => {
  loadScriptContent();
  window.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
});
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
          <div class="cs-dialog-actions">
            <button class="cs-btn cs-btn-icon" type="button" title="插入注释模板 (Ctrl+Shift+D)" @click="insertCommentTemplate">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.5 20a6.5 6.5 0 1 1 0-12 6.5 6.5 0 0 1 0 12Z" />
                <path d="M16.2 12.2 20.2 20.2H4a2 2 0 0 0-2 2v16a2 2 0 0 2 2h16a2 2 0 0 2-2Z" />
                <line x1="12" y1="12" x2="12" y2="16" stroke-dasharray="3,3" />
              </svg>
              <span>插入模板</span>
            </button>
            <button class="cs-btn cs-btn-icon" type="button" title="保存 (Ctrl+S)" @click="handleSave">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21H5a2 2 0 0 0 2h14a2 2 0 0 0 2v14a2 2 0 0 0-2h-14a2 2 0 0 0 2z" />
                <polyline points="16 7 8.5 4 4.5 2 11 16 3" />
              </svg>
              <span>保存</span>
            </button>
            <button class="cs-btn-icon" type="button" title="关闭" @click="emit('close')">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="18" x2="18" y2="6" />
              </svg>
            </button>
          </div>
        </div>

        <div class="cs-dialog-body">
          <div v-if="isLoading" class="cs-loading-state">正在加载脚本内容...</div>
          <div v-else-if="errorMsg" class="cs-error-state">{{ errorMsg }}</div>
          <div v-else>
            <!-- 元数据预览 -->
            <div class="cs-metadata-section">
              <div class="cs-metadata-header">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 5H7a2 2 0 0 1 2v12a2 2 0 0 2 2h12a2 2 0 0 0 2 2Z" />
                  <line x1="12" y1="9" x2="15" y2="9" stroke-dasharray="3,3" />
                </svg>
                <span class="cs-metadata-title">元数据预览</span>
                <span
                  class="cs-metadata-status"
                  :class="{
                    'is-valid': metadataStatus.isValid,
                    'is-warning': !metadataStatus.isValid && !metadataStatus.fields?.name
                  }"
                >
                  {{ metadataStatus.message }}
                </span>
              </div>

              <div class="cs-metadata-body">
                <template v-if="metadata">
                  <div class="cs-field-group">
                    <label class="cs-field-label">名称</label>
                    <div class="cs-field-value" :class="{ 'has-value': metadataStatus.fields && metadataStatus.fields.name }">
                      {{ metadata.name || '未设置' }}
                    </div>
                  </div>

                  <div class="cs-field-group">
                    <label class="cs-field-label">描述</label>
                    <div class="cs-field-value" :class="{ 'has-value': metadataStatus.fields && metadataStatus.fields.description }">
                      {{ metadata.description || '未设置' }}
                    </div>
                  </div>

                  <div class="cs-field-group">
                    <label class="cs-field-label">分类</label>
                    <div class="cs-field-value" :class="{ 'has-value': metadataStatus.fields && metadataStatus.fields.category }">
                      {{ metadata.category || '未分类' }}
                    </div>
                  </div>

                  <div v-if="metadata.tags && metadata.tags.length > 0" class="cs-field-group">
                    <label class="cs-field-label">标签</label>
                    <div class="cs-field-value" :class="{ 'has-value': metadataStatus.fields && metadataStatus.fields.tags }">
                      <span v-for="tag in metadata.tags" :key="tag" class="cs-tag">{{ tag }}</span>
                    </div>
                  </div>

                  <div v-if="metadata.usage" class="cs-field-group">
                    <label class="cs-field-label">使用说明</label>
                    <div class="cs-field-value" :class="{ 'has-value': metadataStatus.fields && metadataStatus.fields.usage }">
                      {{ metadata.usage }}
                    </div>
                  </div>

                  <div v-if="metadata.requires" class="cs-field-group">
                    <label class="cs-field-label">权限要求</label>
                    <div class="cs-field-value">{{ metadata.requires }}</div>
                  </div>

                  <div v-if="metadata.platform" class="cs-field-group">
                    <label class="cs-field-label">适用平台</label>
                    <div class="cs-field-value">{{ metadata.platform }}</div>
                  </div>

                  <div v-if="metadata.version" class="cs-field-group">
                    <label class="cs-field-label">版本</label>
                    <div class="cs-field-value">{{ metadata.version }}</div>
                  </div>

                  <div v-if="metadata.author" class="cs-field-group">
                    <label class="cs-field-label">作者</label>
                    <div class="cs-field-value">{{ metadata.author }}</div>
                  </div>

                  <div v-if="metadata.date" class="cs-field-group">
                    <label class="cs-field-label">日期</label>
                    <div class="cs-field-value">{{ metadata.date }}</div>
                  </div>
                </template>
                <div v-else class="cs-metadata-empty">
                  <div class="cs-metadata-icon">ℹ️</div>
                  <div class="cs-metadata-text">未检测到标准注释</div>
                  <div class="cs-metadata-hint">
                    <button class="cs-btn cs-btn-link" type="button" @click="insertCommentTemplate">
                      🤖 插入注释模板 (Ctrl+Shift+D)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 编辑器 -->
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
                height="400px"
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
  border-radius: 12px;
  width: 1000px;
  max-width: 95%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
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

.cs-dialog-actions {
  display: flex;
  gap: 8px;
}

.cs-btn-icon {
  padding: 4px 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cs-btn-icon:hover {
  background: #f3f4f6;
}

.cs-btn-icon svg {
  width: 16px;
  height: 16px;
  stroke-width: 2px;
}

.cs-btn-icon span {
  font-size: 13.5px;
}

/* 对话框主体 */
.cs-dialog-body {
  flex: 1;
  overflow-y: auto;
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

/* 元数据预览区 */
.cs-metadata-section {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  background: #f8fafc;
}

.cs-metadata-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.cs-metadata-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.cs-metadata-status {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 6px;
  font-weight: 500;
}

.cs-metadata-status.is-valid {
  background: #d1fae5;
  color: #065f46;
}

.cs-metadata-status.is-warning {
  background: #fef3c7;
  color: #d97706;
}

/* 元数据字段 */
.cs-field-group {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 8px 0;
}

.cs-field-label {
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  min-width: 80px;
}

.cs-field-value {
  flex: 1;
  font-size: 14px;
  color: #374151;
  position: relative;
}

.cs-field-value.has-value {
  color: #111827;
}

.cs-tag {
  display: inline-block;
  padding: 4px 10px;
  background: #dbeafe;
  border: 1px solid #3b82f6;
  border-radius: 4px;
  font-size: 13px;
  margin: 0 4px 4px 0;
}

/* 空元数据空状态 */
.cs-metadata-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px;
}

.cs-metadata-icon {
  font-size: 32px;
  opacity: 0.5;
}

.cs-metadata-text {
  font-size: 14px;
  color: #6b7280;
}

.cs-metadata-hint {
  margin-top: 12px;
}

/* 编辑器区域 */
.cs-editor-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
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

.cs-btn-link {
  background: transparent;
  border: none;
  color: #3b82f6;
  text-decoration: underline;
}

.cs-btn-link:hover {
  color: #2563eb;
}
</style>
