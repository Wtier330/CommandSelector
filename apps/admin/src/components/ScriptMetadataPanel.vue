<script setup lang="ts">
import type { ParsedScriptMetadata } from "@commandselector/ui";
import type { MetadataStatus } from "@commandselector/ui";

defineProps<{
  metadata: ParsedScriptMetadata | null;
  metadataStatus: MetadataStatus;
}>();

const emit = defineEmits<{
  (e: "insert-template"): void;
}>();
</script>

<template>
  <div class="cs-metadata-section">
    <div class="cs-metadata-header">
      <svg t="1776522296882" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="11345" width="20" height="20"><path d="M647.46 689.182l41.365-41.365L925.208 884.2l-41.365 41.366zM866.2 98.2h59.1v591h-59.1zM157 98.2h709.2v59.1H157z" fill="#515151" p-id="11346"></path><path d="M157 866.5h531.9v59.1h-591V98.2H157z" fill="#515151" p-id="11347"></path><path d="M511.6 748.3c-130 0-236.4-106.4-236.4-236.4s106.4-236.4 236.4-236.4S748 381.8 748 511.9 641.6 748.3 511.6 748.3z m0-59.1c100.5 0 177.3-76.8 177.3-177.3 0-100.5-76.8-177.3-177.3-177.3s-177.3 76.8-177.3 177.3c0 100.4 76.8 177.3 177.3 177.3z m0 0" fill="#515151" p-id="11348"></path></svg>
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
          <button class="cs-btn cs-btn-link" type="button" @click="emit('insert-template')">
            🤖 插入注释模板 (Ctrl+Shift+D)
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 元数据预览区 */
.cs-metadata-section {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  background: #f8fafc;
  flex-shrink: 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

/* 元数据主体 */
.cs-metadata-body {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
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
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
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

.cs-btn-link {
  background: transparent;
  border: none;
  color: #3b82f6;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  max-width: 100%;
  overflow-wrap: break-word;
  word-break: break-word;
}

.cs-btn-link:hover {
  color: #2563eb;
}
</style>
