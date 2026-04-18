<script setup lang="ts">
import type { ScriptFileMeta } from "@commandselector/shared";

const props = defineProps<{
  script: ScriptFileMeta;
}>();

const emit = defineEmits<{
  (e: "edit", id: string): void;
}>();

// 格式化文件大小
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// 获取功能图标（基于描述或分类，暂时使用通用图标）
function getFunctionIcon(type: string): string {
  if (type === "ps1") return "◇";
  return "⬡";
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
function getTypeLabel(type: string): string {
  return type === "ps1" ? "PowerShell" : "Batch";
}

function handleEdit() {
  emit("edit", props.script.id);
}

// 处理卡片点击 - 触发编辑
function handleCardClick() {
  emit("edit", props.script.id);
}
</script>

<template>
  <div class="cs-script-card" @click="handleCardClick">
    <!-- 功能图标区域 -->
    <div class="cs-card-icon">
      {{ getFunctionIcon(script.type) }}
    </div>

    <!-- 主要内容 -->
    <div class="cs-card-content">
      <div class="cs-card-title">
        {{ script.name }}
        <span v-if="getSyncStatusIcon(script.syncStatus)" class="cs-sync-indicator">
          {{ getSyncStatusIcon(script.syncStatus) }}
        </span>
      </div>

      <div v-if="script.description" class="cs-card-description">
        {{ script.description }}
      </div>
    </div>

    <!-- 元信息 -->
    <div class="cs-card-meta">
      <span class="cs-meta-type">{{ getTypeLabel(script.type) }}</span>
      <span class="cs-meta-size">{{ formatSize(script.size) }}</span>
    </div>

    <!-- 操作按钮 -->
    <div class="cs-card-actions">
      <button
        class="cs-action-btn cs-action-edit"
        type="button"
        title="编辑"
        @click.stop="handleEdit"
      >
        ✏️
      </button>
    </div>
  </div>
</template>

<style scoped>
.cs-script-card {
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

.cs-card-icon {
  align-self: center;
  font-size: 32px;
  line-height: 1;
  margin-bottom: 12px;
  color: #c96442;
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
  color: #5e5d59;
  background: #e8e6dc;
  padding: 4px 10px;
  border-radius: 6px;
  letter-spacing: 0.12px;
}

.cs-meta-size {
  font-family: system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
  font-size: 13px;
  color: #87867f;
}

.cs-card-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  padding-top: 14px;
}

.cs-action-btn {
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e8e6dc;
  transition: all 0.25s ease;
  box-shadow:
    #e8e6dc 0px 0px 0px 0px,
    #d1cfc5 0px 0px 0px 1px;
}

.cs-action-btn:hover {
  transform: scale(1.1);
}

.cs-action-edit:hover {
  box-shadow:
    #dbeafe 0px 0px 0px 0px,
    #dbeafe 0px 0px 0px 1px;
}
</style>
