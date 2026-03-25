<script setup lang="ts">
import { computed, ref } from "vue";
import type { CommandEntry } from "@commandselector/shared";

const props = defineProps<{
  trashedCommands: CommandEntry[];
}>();

const emit = defineEmits<{
  (e: "restore", id: string): void;
  (e: "delete-permanently", id: string): void;
  (e: "empty-trash"): void;
  (e: "close"): void;
}>();

const showConfirmEmpty = ref(false);

const groupedCommands = computed(() => {
  const groups: Record<string, any[]> = {};
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
  const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

  props.trashedCommands.forEach(cmd => {
    const deletedAt = (cmd as any).deletedAt || 0;
    let category = "超过一个月";

    if (deletedAt > oneMonthAgo) {
      category = "本月";
    } else if (deletedAt > oneWeekAgo) {
      category = "上周";
    } else if (deletedAt > oneDayAgo) {
      category = "昨天";
    }

    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(cmd);
  });

  return groups;
});

function formatDeletedAt(deletedAt: number): string {
  const date = new Date(deletedAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (60 * 1000));
      if (diffMinutes < 1) return "刚刚";
      return `${diffMinutes} 分钟前`;
    }
    return `${diffHours} 小时前`;
  } else if (diffDays === 1) {
    return "昨天";
  } else if (diffDays < 7) {
    return `${diffDays} 天前`;
  } else if (diffDays < 30) {
    return `${Math.floor(diffDays / 7)} 周前`;
  } else {
    return `${Math.floor(diffDays / 30)} 月前`;
  }
}

function handleRestore(id: string) {
  emit("restore", id);
}

function handleDeletePermanently(id: string) {
  emit("delete-permanently", id);
}

function handleEmptyTrash() {
  emit("empty-trash");
  showConfirmEmpty.value = false;
}
</script>

<template>
  <div class="cs-trash-modal">
    <div class="cs-trash-header">
      <h3 class="cs-trash-title">回收站</h3>
      <button class="cs-trash-close" @click="$emit('close')">
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>

    <div class="cs-trash-body">
      <div v-if="!Object.keys(groupedCommands).length" class="cs-trash-empty">
        <div class="cs-trash-empty-icon">🗑️</div>
        <div class="cs-trash-empty-text">回收站为空</div>
      </div>

      <div v-else class="cs-trash-content">
        <template v-for="(items, category) in groupedCommands" :key="category">
          <div class="cs-trash-group">
            <div class="cs-trash-group-title">{{ category }}</div>
            <div
              v-for="cmd in items"
              :key="cmd.id"
              class="cs-trash-item"
            >
              <div class="cs-trash-item-info">
                <div class="cs-trash-item-name">{{ cmd.name }}</div>
                <div class="cs-trash-item-time">
                  {{ formatDeletedAt((cmd as any).deletedAt) }}
                </div>
              </div>
              <div class="cs-trash-item-actions">
                <button
                  class="cs-trash-btn cs-trash-btn-restore"
                  title="恢复命令"
                  @click="handleRestore(cmd.id)"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9 9 9 0 0 1-9 9"></path>
                    <path d="M9 12h6"></path>
                  </svg>
                </button>
                <button
                  class="cs-trash-btn cs-trash-btn-delete"
                  title="永久删除"
                  @click="handleDeletePermanently(cmd.id)"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1 -1 2 -2 -2 H7 c -1 0 -2 1 -2 2 V6"></path>
                    <path d="M8 6V4c0 -1 1 -2 2 -2 h4 c1 0 2 1 2 2 v2"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <div v-if="Object.keys(groupedCommands).length" class="cs-trash-footer">
      <button
        v-if="!showConfirmEmpty"
        class="cs-trash-btn-empty"
        @click="showConfirmEmpty = true"
      >
        清空回收站
      </button>
      <div v-else class="cs-trash-confirm">
        <span>确定要清空回收站吗？</span>
        <button class="cs-trash-btn cs-trash-btn-cancel" @click="showConfirmEmpty = false">取消</button>
        <button class="cs-trash-btn cs-trash-btn-confirm" @click="handleEmptyTrash">确认清空</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cs-trash-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(500px, 90vw);
  max-height: 80vh;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  z-index: 1000;
}

.cs-trash-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cs-trash-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.cs-trash-close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #94a3b8;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.cs-trash-close:hover {
  background: #f1f5f9;
  color: #475569;
}

.cs-trash-body {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.cs-trash-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.cs-trash-empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.cs-trash-empty-text {
  font-size: 14px;
  color: #94a3b8;
}

.cs-trash-content {
  padding: 16px 20px;
}

.cs-trash-group {
  margin-bottom: 24px;
}

.cs-trash-group:last-child {
  margin-bottom: 0;
}

.cs-trash-group-title {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.cs-trash-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
  margin-bottom: 8px;
  transition: all 0.2s;
}

.cs-trash-item:hover {
  background: #f1f5f9;
  border-color: #d1d5db;
}

.cs-trash-item-info {
  flex: 1;
  min-width: 0;
}

.cs-trash-item-name {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 4px;
}

.cs-trash-item-time {
  font-size: 12px;
  color: #94a3b8;
}

.cs-trash-item-actions {
  display: flex;
  gap: 8px;
}

.cs-trash-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.cs-trash-btn-restore {
  background: #dbeafe;
  color: #166534;
}

.cs-trash-btn-restore:hover {
  background: #bbf7d0;
}

.cs-trash-btn-delete {
  background: #fee2e2;
  color: #dc2626;
}

.cs-trash-btn-delete:hover {
  background: #fecaca;
}

.cs-trash-footer {
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
}

.cs-trash-btn-empty {
  width: 100%;
  height: 36px;
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cs-trash-btn-empty:hover {
  background: #fecaca;
  border-color: #ef4444;
}

.cs-trash-confirm {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.cs-trash-confirm span {
  flex: 1;
  color: #64748b;
  font-size: 14px;
}

.cs-trash-btn-cancel {
  height: 32px;
  padding: 0 16px;
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.cs-trash-btn-cancel:hover {
  background: #e2e8f0;
}

.cs-trash-btn-confirm {
  height: 32px;
  padding: 0 16px;
  background: #dc2626;
  color: white;
  border: 1px solid #dc2626;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.cs-trash-btn-confirm:hover {
  background: #b91c1c;
  border-color: #b91c1c;
}
</style>
