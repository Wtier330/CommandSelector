<script setup lang="ts">
import { ref, computed } from "vue";
import type { CommandEntry } from "@commandselector/shared";

const props = defineProps<{
  categories: string[];
  commands: CommandEntry[];
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "add", category: string): void;
  (e: "delete", category: string, action: "move" | "clear", targetCategory?: string): void;
}>();

// 新分类输入
const newCategoryInput = ref("");
const addError = ref("");

// 删除确认对话框状态
const deleteConfirmDialog = ref<{
  category: string;
  affectedCommands: CommandEntry[];
} | null>(null);
const deleteAction = ref<"move" | "clear" | null>(null);
const targetCategory = ref<string>("");

// 计算每个分类的命令数量
const categoryCommandCount = computed(() => {
  const counts: Record<string, number> = {};
  props.categories.forEach(cat => {
    counts[cat] = props.commands.filter(cmd => cmd.category === cat).length;
  });
  return counts;
});

// 添加新分类
function handleAddCategory() {
  const newCat = newCategoryInput.value.trim();
  if (!newCat) {
    addError.value = "请输入分类名称";
    return;
  }
  if (props.categories.includes(newCat)) {
    addError.value = "分类已存在";
    return;
  }
  emit("add", newCat);
  newCategoryInput.value = "";
  addError.value = "";
}

// 打开删除确认对话框
function openDeleteConfirm(category: string) {
  const affectedCommands = props.commands.filter(cmd => cmd.category === category);
  deleteConfirmDialog.value = { category, affectedCommands };
  deleteAction.value = null;
  targetCategory.value = "";
}

// 关闭删除确认对话框
function closeDeleteConfirm() {
  deleteConfirmDialog.value = null;
  deleteAction.value = null;
  targetCategory.value = "";
}

// 确认删除
function confirmDelete() {
  if (!deleteConfirmDialog.value || !deleteAction.value) return;

  if (deleteAction.value === "move" && !targetCategory.value) {
    return;
  }

  emit("delete", deleteConfirmDialog.value.category, deleteAction.value, targetCategory.value);
  closeDeleteConfirm();
}

// 获取可用于移动的分类（排除要删除的分类）
const availableCategories = computed(() => {
  if (!deleteConfirmDialog.value) return [];
  return props.categories.filter(cat => cat !== deleteConfirmDialog.value?.category);
});
</script>

<template>
  <div class="cs-dialog-overlay" @click.self="emit('close')">
    <div class="cs-dialog">
      <div class="cs-dialog-header">
        <div class="cs-dialog-title">管理分类</div>
        <button class="cs-dialog-close" type="button" @click="emit('close')">&times;</button>
      </div>
      <div class="cs-dialog-body">
        <!-- 添加新分类 -->
        <div class="cs-add-category">
          <span class="cs-add-label">添加新分类</span>
          <div class="cs-add-row">
            <input
              v-model="newCategoryInput"
              class="cs-input cs-input-sm"
              placeholder="输入分类名称"
              @keyup.enter="handleAddCategory"
            />
            <button
              class="cs-btn cs-btn-primary cs-btn-sm"
              type="button"
              @click="handleAddCategory"
            >
              添加
            </button>
          </div>
          <div v-if="addError" class="cs-error-text">{{ addError }}</div>
        </div>

        <!-- 分类列表 -->
        <div class="cs-category-list">
          <div class="cs-category-list-title">现有分类 ({{ categories.length }})</div>
          <div v-if="categories.length === 0" class="cs-empty-text">暂无分类</div>
          <div v-else class="cs-category-items">
            <div
              v-for="cat in categories"
              :key="cat"
              class="cs-category-item"
            >
              <span class="cs-category-name">{{ cat }}</span>
              <div class="cs-category-meta">
                <span class="cs-category-count">{{ categoryCommandCount[cat] || 0 }} 条命令</span>
                <button
                  class="cs-btn cs-btn-icon cs-btn-danger"
                  type="button"
                  :title="categoryCommandCount[cat] > 0 ? '删除分类' : '删除空分类'"
                  @click="openDeleteConfirm(cat)"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="cs-dialog-footer">
        <button class="cs-btn cs-btn-outline" type="button" @click="emit('close')">关闭</button>
      </div>
    </div>
  </div>

  <!-- 删除确认对话框 -->
  <div v-if="deleteConfirmDialog" class="cs-dialog-overlay" @click.self="closeDeleteConfirm">
    <div class="cs-dialog cs-dialog-confirm">
      <div class="cs-dialog-header">
        <div class="cs-dialog-title">确认删除分类</div>
        <button class="cs-dialog-close" type="button" @click="closeDeleteConfirm">&times;</button>
      </div>
      <div class="cs-dialog-body">
        <div class="cs-confirm-warning">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12" y2="16"></line>
          </svg>
          <span>该分类下有 {{ deleteConfirmDialog.affectedCommands.length }} 条命令</span>
        </div>
        <div class="cs-confirm-desc">删除分类「{{ deleteConfirmDialog.category }}」后，请选择如何处理这些命令：</div>

        <div class="cs-confirm-options">
          <label class="cs-confirm-option">
            <input
              type="radio"
              v-model="deleteAction"
              value="move"
            />
            <div class="cs-option-content">
              <span class="cs-option-label">移动到其他分类</span>
              <select
                v-model="targetCategory"
                class="cs-input cs-input-sm"
                :disabled="deleteAction !== 'move'"
              >
                <option value="">请选择目标分类</option>
                <option v-for="cat in availableCategories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>
          </label>

          <label class="cs-confirm-option">
            <input
              type="radio"
              v-model="deleteAction"
              value="clear"
            />
            <div class="cs-option-content">
              <span class="cs-option-label">清空分类</span>
              <span class="cs-option-desc">命令的分类字段将被清空</span>
            </div>
          </label>
        </div>
      </div>
      <div class="cs-dialog-footer">
        <button class="cs-btn cs-btn-outline" type="button" @click="closeDeleteConfirm">取消</button>
        <button
          class="cs-btn cs-btn-danger"
          type="button"
          :disabled="!deleteAction || (deleteAction === 'move' && !targetCategory)"
          @click="confirmDelete"
        >
          确认删除
        </button>
      </div>
    </div>
  </div>
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
  width: 480px;
  max-width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.cs-dialog-confirm {
  width: 420px;
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
  color: #111827;
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
  transition: background 0.2s;
}

.cs-dialog-close:hover {
  background: #f3f4f6;
}

.cs-dialog-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

/* 添加分类部分 */
.cs-add-category {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.cs-add-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.cs-add-row {
  display: flex;
  gap: 8px;
}

.cs-add-row .cs-input {
  flex: 1;
}

.cs-error-text {
  margin-top: 8px;
  font-size: 13px;
  color: #dc2626;
}

/* 分类列表 */
.cs-category-list-title {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 12px;
}

.cs-empty-text {
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
  padding: 20px 0;
}

.cs-category-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cs-category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #f9fafb;
  border-radius: 6px;
  transition: background 0.2s;
}

.cs-category-item:hover {
  background: #f3f4f6;
}

.cs-category-name {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.cs-category-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cs-category-count {
  font-size: 12px;
  color: #6b7280;
}

.cs-btn-icon {
  width: 28px;
  height: 28px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cs-btn-danger {
  color: #dc2626;
  border-color: #fecaca;
  background: #fef2f2;
}

.cs-btn-danger:hover:not(:disabled) {
  background: #fee2e2;
}

/* 删除确认对话框 */
.cs-confirm-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 6px;
  color: #ea580c;
  font-size: 14px;
  margin-bottom: 12px;
}

.cs-confirm-desc {
  font-size: 14px;
  color: #374151;
  margin-bottom: 16px;
}

.cs-confirm-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cs-confirm-option {
  display: flex;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.cs-confirm-option:hover {
  border-color: #d1d5db;
}

.cs-confirm-option input[type="radio"] {
  margin-top: 2px;
}

.cs-option-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cs-option-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.cs-option-desc {
  font-size: 12px;
  color: #6b7280;
}

.cs-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
}

.cs-dialog-footer button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
