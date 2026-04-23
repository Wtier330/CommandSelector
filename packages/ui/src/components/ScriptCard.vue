<script setup lang="ts">
import { computed } from "vue";
import type { ScriptFileMeta, ScriptType } from "@commandselector/shared";

const props = defineProps<{
  script: ScriptFileMeta;
  compact?: boolean;
}>();

const emit = defineEmits<{
  (e: "edit", id: string): void;
  (e: "more", id: string): void;
}>();

// 脚本类型配置
const typeConfig: Record<ScriptType, { label: string; color: string; icon: string }> = {
  bat: { label: 'BAT', color: '#4d4d4d', icon: '⚙️' },
  ps1: { label: 'PowerShell', color: '#2b579a', icon: '💠' },
  vbs: { label: 'VBS', color: '#8b4513', icon: '📜' },
  sh: { label: 'Shell', color: '#2e8b57', icon: '🐚' },
  cmd: { label: 'CMD', color: '#6b7280', icon: '💻' },
  py: { label: 'Python', color: '#3776ab', icon: '🐍' }
};

// 计算脚本摘要描述（优先使用简短描述）
const summaryDescription = computed(() => {
  // 优先使用元数据中的简短描述
  if (props.script.metadata?.shortDescription) {
    return props.script.metadata.shortDescription;
  }
  // 其次使用元数据中的完整描述
  if (props.script.metadata?.description) {
    return props.script.metadata.description;
  }
  // 最后使用 script.description
  if (props.script.description) {
    return props.script.description;
  }
  return "暂无描述信息";
});

// 判断描述是否有有效值
const hasValidDescription = computed(() => {
  const desc = props.script.metadata?.shortDescription
    || props.script.metadata?.description
    || props.script.description
    || "";
  return desc.trim().length > 0;
});

// 格式化文件大小
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// 获取同步状态图标
function getSyncStatusIcon(status?: string): string {
  if (!status) return "";
  if (status === "synced") return "";
  if (status === "modified") return "●";
  if (status === "file-missing") return "⚠️";
  return "";
}

// 获取文件类型标签
function getTypeLabel(type: ScriptType): string {
  return typeConfig[type]?.label || type.toUpperCase();
}

// 获取类型图标
function getTypeIcon(type: ScriptType): string {
  return typeConfig[type]?.icon || '📄';
}

function handleEdit() {
  emit("edit", props.script.id);
}

function handleMore(e: Event) {
  e.stopPropagation();
  emit("more", props.script.id);
}
</script>

<template>
  <div class="cs-script-card" :class="{ compact }" @dblclick="handleEdit">
    <!-- 紧凑模式：左侧图标 -->
    <template v-if="compact">
      <div class="cs-card-icon-compact">
        {{ getTypeIcon(script.type) }}
      </div>
      <div class="cs-card-content-compact">
        <div class="cs-card-title-compact">
          <span class="cs-name">{{ script.name }}</span>
          <span v-if="getSyncStatusIcon(script.syncStatus)" class="cs-sync-indicator">
            {{ getSyncStatusIcon(script.syncStatus) }}
          </span>
        </div>
        <div class="cs-card-desc-compact" :class="{ 'has-value': hasValidDescription }">
          {{ summaryDescription }}
        </div>
      </div>
      <div class="cs-card-meta-compact">
        <span class="cs-meta-type" :style="{ background: typeConfig[script.type]?.color }">
          {{ getTypeLabel(script.type) }}
        </span>
        <span class="cs-meta-size">{{ formatSize(script.size) }}</span>
      </div>
      <div class="cs-card-actions-compact">
        <button class="cs-action-btn" title="编辑" @click.stop="handleEdit">✏️</button>
        <button class="cs-action-btn" title="更多" @click.stop="handleMore">⋮</button>
      </div>
    </template>

    <!-- 网格模式 -->
    <template v-else>
      <!-- 功能图标区域 -->
      <div class="cs-card-icon">
        {{ getTypeIcon(script.type) }}
      </div>

      <!-- 主要内容 -->
      <div class="cs-card-content">
        <div class="cs-card-title">
          {{ script.name }}
          <span v-if="getSyncStatusIcon(script.syncStatus)" class="cs-sync-indicator">
            {{ getSyncStatusIcon(script.syncStatus) }}
          </span>
        </div>

        <!-- 描述摘要 -->
        <div class="cs-card-description" :class="{ 'has-value': hasValidDescription }">
          {{ summaryDescription }}
        </div>
      </div>

      <!-- 元信息 -->
      <div class="cs-card-meta">
        <span class="cs-meta-type" :style="{ background: typeConfig[script.type]?.color }">
          {{ getTypeLabel(script.type) }}
        </span>
        <span class="cs-meta-size">{{ formatSize(script.size) }}</span>
      </div>

      <!-- 编辑按钮 -->
      <button
        class="cs-action-btn cs-action-edit"
        type="button"
        title="编辑"
        @click.stop="handleEdit"
      >
        ✏️
      </button>
    </template>
  </div>
</template>

<style scoped>
.cs-script-card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: #faf9f5;
  border: 1px solid #f0eee6;
  border-radius: 12px;
  box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.05);
  transition: all 0.25s ease;
  min-height: 180px;
}

.cs-script-card:hover {
  transform: translateY(-4px);
  box-shadow:
    #faf9f5 0px 0px 0px 0px,
    #d1cfc5 0px 0px 0px 1px;
}

/* 紧凑模式（列表视图） */
.cs-script-card.compact {
  flex-direction: row;
  align-items: center;
  padding: 12px 16px;
  min-height: auto;
  gap: 12px;
}

.cs-script-card.compact:hover {
  transform: none;
}

.cs-card-icon-compact {
  font-size: 24px;
  width: 36px;
  text-align: center;
  flex-shrink: 0;
}

.cs-card-content-compact {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cs-card-title-compact {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #141413;
}

.cs-card-title-compact .cs-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cs-card-desc-compact {
  font-size: 12px;
  color: #87867f;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cs-card-desc-compact.has-value {
  color: #5e5d59;
}

.cs-card-meta-compact {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.cs-card-actions-compact {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

/* 网格模式 */
.cs-card-icon {
  font-size: 32px;
  text-align: center;
  margin-bottom: 12px;
}

.cs-card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.cs-card-title {
  font-family: "Georgia", serif;
  font-size: 18px;
  font-weight: 500;
  color: #141413;
  line-height: 1.30;
  display: flex;
  align-items: center;
  gap: 8px;
}

.cs-sync-indicator {
  font-size: 12px;
  margin-left: auto;
  color: #c96442;
}

.cs-card-description {
  font-family: system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
  font-size: 14px;
  color: #5e5d59;
  line-height: 1.60;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 44px;
}

.cs-card-description.has-value {
  color: #141413;
}

.cs-card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0eee6;
}

.cs-meta-type {
  font-family: system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
  font-size: 11px;
  font-weight: 500;
  color: white;
  background: #4d4d4d;
  padding: 4px 10px;
  border-radius: 6px;
  letter-spacing: 0.12px;
}

.cs-meta-size {
  font-family: system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
  font-size: 13px;
  color: #87867f;
}

/* 编辑按钮 */
.cs-action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e8e6dc;
  transition: all 0.25s ease;
}

.cs-action-btn:hover {
  transform: scale(1.1);
}

.cs-action-edit {
  position: absolute;
  top: 12px;
  right: 12px;
}

.cs-action-btn:hover {
  background: #dbeafe;
}
</style>
