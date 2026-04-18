<script setup lang="ts">
import { ref, computed } from "vue";
import type { ScriptFileMeta } from "@commandselector/shared";
import ScriptCard from "./ScriptCard.vue";

const props = defineProps<{
  scripts: ScriptFileMeta[];
}>();

const emit = defineEmits<{
  (e: "edit", id: string): void;
  (e: "run", id: string): void;
  (e: "more", id: string): void;
}>();

// 搜索和筛选状态
const searchKeyword = ref("");
const selectedCategories = ref<string[]>(["__all__"]);

// 计算所有分类
const categories = computed(() => {
  const set = new Set<string>();
  for (const s of props.scripts) {
    if (s.metadata?.category) {
      set.add(s.metadata.category);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
});

// 统计信息
const stats = computed(() => {
  const batCount = props.scripts.filter((s) => s.type === "bat").length;
  const ps1Count = props.scripts.filter((s) => s.type === "ps1").length;
  return { batCount, ps1Count, total: props.scripts.length };
});

// 过滤后的脚本
const filteredScripts = computed(() => {
  const k = searchKeyword.value.trim().toLowerCase();
  const isAll = selectedCategories.value.includes("__all__");
  const isNone = selectedCategories.value.includes("__none__");

  let result = props.scripts;

  // 分类过滤
  if (!isAll) {
    if (isNone) {
      result = [];
    } else {
      result = result.filter((s) => {
        const category = s.metadata?.category ?? "";
        return selectedCategories.value.includes(category);
      });
    }
  }

  // 关键词搜索（简单实现，后续使用智能搜索）
  if (k) {
    result = result.filter((s) => {
      const fields = [
        s.name,
        s.description ?? "",
        s.metadata?.name ?? "",
        s.metadata?.description ?? "",
        s.metadata?.category ?? "",
        ...(s.metadata?.tags ?? []),
      ].join(" ").toLowerCase();
      return fields.includes(k);
    });
  }

  return result;
});

// 处理编辑
function handleEdit(id: string) {
  emit("edit", id);
}

// 处理运行
function handleRun(id: string) {
  emit("run", id);
}

// 处理更多操作
function handleMore(id: string) {
  emit("more", id);
}

// 处理分类选择
function handleCategorySelect(category: string) {
  if (category === "__all__") {
    selectedCategories.value = ["__all__"];
  } else if (category === "__none__") {
    selectedCategories.value = ["__none__"];
  } else {
    const index = selectedCategories.value.indexOf(category);
    if (index >= 0) {
      selectedCategories.value.splice(index, 1);
      if (selectedCategories.value.length === 0) {
        selectedCategories.value = ["__all__"];
      }
    } else {
      selectedCategories.value = selectedCategories.value.filter(
        (c) => c !== "__all__" && c !== "__none__"
      );
      selectedCategories.value.push(category);
    }
  }
}
</script>

<template>
  <div class="cs-script-grid-view">
    <!-- 工具栏 -->
    <div class="cs-toolbar">
      <div class="cs-toolbar-left">
        <input
          v-model="searchKeyword"
          class="cs-input"
          placeholder="搜索脚本..."
        />
      </div>
      <div class="cs-toolbar-right">
        <div class="cs-filter-buttons">
          <button
            class="cs-filter-btn"
            :class="{ active: selectedCategories.includes('__all__') }"
            type="button"
            @click="handleCategorySelect('__all__')"
          >
            全部 ({{ stats.total }})
          </button>
          <button
            class="cs-filter-btn"
            :class="{ active: selectedCategories.includes('__none__') }"
            type="button"
            @click="handleCategorySelect('__none__')"
          >
            未分类 (0)
          </button>
          <template v-if="categories.length">
            <div class="cs-divider"></div>
            <button
              v-for="cat in categories"
              :key="cat"
              class="cs-filter-btn"
              :class="{ active: selectedCategories.includes(cat) }"
              type="button"
              @click="handleCategorySelect(cat)"
            >
              {{ cat }}
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- 卡片网格 -->
    <div class="cs-card-grid">
      <template v-if="filteredScripts.length > 0">
        <ScriptCard
          v-for="script in filteredScripts"
          :key="script.id"
          :script="script"
          @edit="handleEdit"
          @run="handleRun"
          @more="handleMore"
        />
      </template>
      <div v-else class="cs-empty-state">
        <div class="cs-empty-icon">📄</div>
        <div class="cs-empty-text">
          {{ searchKeyword ? '没有找到匹配的脚本' : '暂无脚本' }}
        </div>
        <div v-if="searchKeyword" class="cs-empty-hint">
          尝试使用其他关键词或清空搜索
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cs-script-grid-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

/* 工具栏 */
.cs-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--cs-border, #e5e7eb);
}

.cs-toolbar-left {
  flex: 1;
}

.cs-input {
  width: 100%;
  max-width: 300px;
  padding: 8px 12px;
  border: 1px solid var(--cs-border, #e5e7eb);
  border-radius: 6px;
  font-size: 14px;
  background: white;
  color: var(--cs-text, #111827);
}

.cs-input:focus {
  outline: none;
  border-color: var(--cs-blue, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.cs-toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 分类过滤器 */
.cs-filter-buttons {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.cs-filter-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-size: 13px;
  color: var(--cs-text-muted, #6b7280);
  cursor: pointer;
  transition: all 0.2s ease;
}

.cs-filter-btn:hover {
  background: var(--cs-muted, #f3f4f6);
}

.cs-filter-btn.active {
  background: var(--cs-blue, #3b82f6);
  color: white;
}

.cs-divider {
  width: 1px;
  height: 20px;
  background: var(--cs-border, #e5e7eb);
  margin: 0 4px;
}

/* 卡片网格 - 响应式 */
.cs-card-grid {
  display: grid;
  gap: 16px;
  /* 默认 5 列 */
  grid-template-columns: repeat(5, 1fr);
}

@media (max-width: 1200px) {
  .cs-card-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .cs-card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .cs-card-grid {
    grid-template-columns: 1fr;
  }
}

/* 空状态 */
.cs-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--cs-text-muted, #6b7280);
  text-align: center;
}

.cs-empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.cs-empty-text {
  font-size: 16px;
  margin-bottom: 8px;
}

.cs-empty-hint {
  font-size: 14px;
  opacity: 0.7;
}
</style>
