<script setup lang="ts">
	import type { ScriptFileMeta } from "@commandselector/shared";

	const props = defineProps<{
	  script: ScriptFileMeta;
	}>();

	const emit = defineEmits<{
	  (e: "edit", id: string): void;
	  (e: "run", id: string): void;
	  (e: "more", id: string): void;
	}>();

	// 格式化文件大小
	function formatSize(bytes: number): string {
	  if (bytes < 1024) return `${bytes} B`;
	  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	// 获取功能图标（基于描述或分类，暂时使用通用图标）
	function getFunctionIcon(type: string): string {
	  if (type === "ps1") return "🔷";
	  return "🔄";
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
	  return type === "ps1" ? "PS1" : "BAT";
	}

	function handleEdit() {
	  emit("edit", props.script.id);
	}

	function handleRun() {
	  emit("run", props.script.id);
	}

	function handleMore() {
	  emit("more", props.script.id);
	}
</script>

<template>
  <div class="cs-script-card">
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
        @click="handleEdit"
      >
        ✏️
      </button>
      <button
        class="cs-action-btn cs-action-run"
        type="button"
        title="运行"
        @click="handleRun"
      >
        ▶️
      </button>
    </div>
  </div>
</template>

<style scoped>
.cs-script-card {
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: white;
  border: 1px solid var(--cs-border, #e5e7eb);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
  min-height: 160px;
}

.cs-script-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.cs-card-icon {
  align-self: center;
  font-size: 40px;
  line-height: 1;
  margin-bottom: 12px;
}

.cs-card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.cs-card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--cs-text, #111827);
  line-height: 1.4;
  display: flex;
  align-items: center;
  gap: 6px;
}

.cs-sync-indicator {
  font-size: 12px;
  margin-left: auto;
}

.cs-card-description {
  font-size: 13px;
  color: var(--cs-text-muted, #6b7280);
  line-height: 1.5;
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
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--cs-muted, #f3f4f6);
}

.cs-meta-type {
  font-size: 11px;
  font-weight: 600;
  color: var(--cs-text-muted, #6b7280);
  background: var(--cs-muted, #f3f4f6);
  padding: 4px 8px;
  border-radius: 4px;
}

.cs-meta-size {
  font-size: 12px;
  color: var(--cs-text-muted, #6b7280);
}

.cs-card-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding-top: 12px;
}

.cs-action-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--cs-muted, #f3f4f6);
  transition: all 0.2s ease;
}

.cs-action-btn:hover {
  background: var(--cs-hover-bg, #e5e7eb);
  transform: scale(1.1);
}

.cs-action-edit:hover {
  background: #dbeafe;
}

.cs-action-run:hover {
  background: #d1fae5;
}
</style>
