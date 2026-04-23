<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { ScriptFileMeta, ScriptType } from "@commandselector/shared";
import ScriptCard from "./ScriptCard.vue";
import { fuzzyMatch } from "../composables/usePinyinSearch";

const props = defineProps<{
  scripts: ScriptFileMeta[];
}>();

const emit = defineEmits<{
  (e: "edit", id: string): void;
  (e: "more", id: string): void;
}>();

// 视图模式
const viewMode = ref<'grid' | 'list'>('grid');

// 搜索和筛选状态
const searchKeyword = ref("");

// 调试：监控 searchKeyword 变化
watch(searchKeyword, (newVal) => {
  console.log("[searchKeyword] changed to:", newVal);
});

const selectedCategories = ref<string[]>(["__all__"]);
const selectedType = ref<ScriptType | 'all'>('all');
const showTypeDropdown = ref(false);

// 脚本类型配置
const scriptTypeConfig: Record<ScriptType, { label: string; color: string }> = {
  bat: { label: 'BAT', color: '#4d4d4d' },
  ps1: { label: 'PowerShell', color: '#2b579a' },
  vbs: { label: 'VBS', color: '#8b4513' },
  sh: { label: 'Shell', color: '#2e8b57' },
  cmd: { label: 'CMD', color: '#6b7280' },
  py: { label: 'Python', color: '#3776ab' }
};

// 所有类型选项
const allTypeOptions = ['bat', 'ps1', 'vbs', 'sh', 'cmd', 'py'] as const;

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
  const counts: Record<ScriptType, number> = {
    bat: 0,
    ps1: 0,
    vbs: 0,
    sh: 0,
    cmd: 0,
    py: 0
  };
  for (const s of props.scripts) {
    counts[s.type] = (counts[s.type] || 0) + 1;
  }
  return {
    ...counts,
    total: props.scripts.length
  };
});

// 当前选中类型的标签
const selectedTypeLabel = computed(() => {
  if (selectedType.value === 'all') return '全部类型';
  return scriptTypeConfig[selectedType.value]?.label || selectedType.value;
});

// 过滤后的脚本
const filteredScripts = computed(() => {
  const k = searchKeyword.value.trim().toLowerCase();

  console.log("[search] keyword:", searchKeyword.value, "-> processed:", k, "scripts count:", props.scripts.length);

  const isAllCats = selectedCategories.value.includes("__all__");
  const isNoneCats = selectedCategories.value.includes("__none__");

  let result = props.scripts;

  // 类型过滤
  if (selectedType.value !== 'all') {
    result = result.filter(s => s.type === selectedType.value);
  }

  // 分类过滤
  if (!isAllCats) {
    if (isNoneCats) {
      result = [];
    } else {
      result = result.filter((s) => {
        const category = s.metadata?.category ?? "";
        return selectedCategories.value.includes(category);
      });
    }
  }

  // 关键词搜索（支持拼音首字母匹配）
  if (k) {
    console.log("[search] doing fuzzy search with:", k);
    result = result.filter((s) => {
      // 检查名称
      if (fuzzyMatch(s.name, k).matched) return true;
      // 检查简称/描述
      if (s.description && fuzzyMatch(s.description, k).matched) return true;
      // 检查元数据简称
      if (s.metadata?.name && fuzzyMatch(s.metadata.name, k).matched) return true;
      // 检查元数据描述
      if (s.metadata?.description && fuzzyMatch(s.metadata.description, k).matched) return true;
      // 检查分类
      if (s.metadata?.category && fuzzyMatch(s.metadata.category, k).matched) return true;
      // 检查标签
      if (s.metadata?.tags?.some(tag => fuzzyMatch(tag, k).matched)) return true;
      return false;
    });
    console.log("[search] filtered result count:", result.length);
  }

  return result;
});

// 处理编辑
function handleEdit(id: string) {
  emit("edit", id);
}

// 处理更多操作
function handleMore(id: string) {
  emit("more", id);
}

// 处理类型选择
function handleTypeSelect(type: ScriptType | 'all') {
  selectedType.value = type;
  showTypeDropdown.value = false;
}

// 点击外部关闭下拉
function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!target.closest('.cs-type-dropdown')) {
    showTypeDropdown.value = false;
  }
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
  <div class="cs-script-grid-view" @click="handleClickOutside">
    <!-- 工具栏 -->
    <div class="cs-toolbar">
      <div class="cs-toolbar-left">
        <!-- 统计信息 -->
        <div class="cs-stats-summary">
          <span class="cs-total-count">共 <em>{{ stats.total }}</em> 个脚本</span>
        </div>

        <!-- 类型下拉选择器 -->
        <div class="cs-type-dropdown">
          <button
            class="cs-dropdown-trigger"
            :class="{ active: showTypeDropdown }"
            @click.stop="showTypeDropdown = !showTypeDropdown"
          >
            <span>{{ selectedTypeLabel }}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div v-if="showTypeDropdown" class="cs-dropdown-menu">
            <button
              class="cs-dropdown-item"
              :class="{ active: selectedType === 'all' }"
              @click="handleTypeSelect('all')"
            >
              <span class="cs-dropdown-dot" style="background: #6b7280"></span>
              全部类型
              <span class="cs-dropdown-count">{{ stats.total }}</span>
            </button>
            <div class="cs-dropdown-divider"></div>
            <button
              v-for="type in allTypeOptions"
              :key="type"
              class="cs-dropdown-item"
              :class="{ active: selectedType === type }"
              @click="handleTypeSelect(type)"
            >
              <span class="cs-dropdown-dot" :style="{ background: scriptTypeConfig[type].color }"></span>
              {{ scriptTypeConfig[type].label }}
              <span class="cs-dropdown-count">{{ stats[type] }}</span>
            </button>
          </div>
        </div>
      </div>
      <div class="cs-toolbar-right">
        <!-- 搜索框 -->
        <input
          v-model="searchKeyword"
          class="cs-input"
          placeholder="搜索脚本..."
        />
        <!-- 视图切换 -->
        <div class="cs-view-toggle">
          <button
            class="cs-toggle-btn"
            :class="{ active: viewMode === 'grid' }"
            title="网格视图"
            @click="viewMode = 'grid'"
          >
            <svg viewBox="0 0 16 16" width="14" height="14">
              <rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor"/>
              <rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor"/>
              <rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor"/>
              <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor"/>
            </svg>
          </button>
          <button
            class="cs-toggle-btn"
            :class="{ active: viewMode === 'list' }"
            title="列表视图"
            @click="viewMode = 'list'"
          >
            <svg viewBox="0 0 16 16" width="14" height="14">
              <rect x="1" y="2" width="14" height="2" rx="1" fill="currentColor"/>
              <rect x="1" y="7" width="14" height="2" rx="1" fill="currentColor"/>
              <rect x="1" y="12" width="14" height="2" rx="1" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 分类过滤器 -->
    <div class="cs-filter-bar">
      <button
        class="cs-filter-btn"
        :class="{ active: selectedCategories.includes('__all__') }"
        type="button"
        @click="handleCategorySelect('__all__')"
      >
        全部
      </button>
      <button
        class="cs-filter-btn"
        :class="{ active: selectedCategories.includes('__none__') }"
        type="button"
        @click="handleCategorySelect('__none__')"
      >
        未分类
      </button>
      <template v-if="categories.length">
        <div class="cs-filter-divider"></div>
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

    <!-- 卡片网格/列表 -->
    <div class="cs-card-container" :class="viewMode">
      <template v-if="filteredScripts.length > 0">
        <ScriptCard
          v-for="script in filteredScripts"
          :key="script.id"
          :script="script"
          :compact="viewMode === 'list'"
          @edit="handleEdit"
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
  padding: 16px 20px;
}

/* 工具栏 */
.cs-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.cs-toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.cs-toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 统计信息 */
.cs-stats-summary {
  display: flex;
  align-items: center;
}

.cs-total-count {
  font-size: 13px;
  color: #6b7280;
}

.cs-total-count em {
  font-style: normal;
  font-weight: 600;
  color: #374151;
}

/* 搜索框 */
.cs-input {
  padding: 8px 12px;
  border: 1px solid #e8e6dc;
  border-radius: 8px;
  font-size: 13px;
  background: #faf9f5;
  color: #141413;
  width: 160px;
  transition: all 0.2s ease;
}

.cs-input:focus {
  outline: none;
  border-color: #3898ec;
  box-shadow: 0 0 0 3px rgba(56, 152, 236, 0.1);
  width: 200px;
}

/* 视图切换 */
.cs-view-toggle {
  display: flex;
  background: #f3f4f6;
  border-radius: 6px;
  padding: 2px;
}

.cs-toggle-btn {
  padding: 6px 8px;
  border: none;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.cs-toggle-btn:hover {
  color: #6b7280;
}

.cs-toggle-btn.active {
  background: white;
  color: #374151;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* 分类过滤器 */
.cs-filter-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.cs-filter-btn {
  padding: 4px 10px;
  border: none;
  border-radius: 4px;
  background: transparent;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cs-filter-btn:hover {
  background: #f3f4f6;
}

.cs-filter-btn.active {
  background: #e5e7eb;
  color: #374151;
  font-weight: 500;
}

.cs-filter-divider {
  width: 1px;
  height: 16px;
  background: #e5e7eb;
  margin: 0 4px;
}

/* 卡片容器 */
.cs-card-container {
  display: grid;
  gap: 16px;
  /* 默认网格视图 5 列 */
  grid-template-columns: repeat(5, 1fr);
}

.cs-card-container.list {
  grid-template-columns: 1fr;
  gap: 8px;
}

@media (max-width: 1400px) {
  .cs-card-container {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 1100px) {
  .cs-card-container {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .cs-card-container {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .cs-card-container {
    grid-template-columns: 1fr;
  }
}

/* 空状态 */
.cs-empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: #87867f;
  text-align: center;
}

.cs-empty-icon {
  font-size: 56px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.cs-empty-text {
  font-family: "Georgia", serif;
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #5e5d59;
}

.cs-empty-hint {
  font-size: 14px;
  opacity: 0.7;
}

/* 类型下拉选择器 */
.cs-type-dropdown {
  position: relative;
}

.cs-dropdown-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--claude-border-warm);
  border-radius: var(--claude-radius-sm);
  background: var(--claude-ivory);
  font-size: 13px;
  color: var(--claude-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.cs-dropdown-trigger:hover {
  border-color: var(--claude-border);
  background: var(--claude-ivory);
}

.cs-dropdown-trigger svg {
  transition: transform 0.2s ease;
}

.cs-dropdown-trigger.active svg {
  transform: rotate(180deg);
}

.cs-dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 160px;
  background: var(--claude-ivory);
  border: 1px solid var(--claude-border-warm);
  border-radius: var(--claude-radius-sm);
  box-shadow: 0px 0px 0px 1px var(--claude-border-warm), 0px 4px 24px rgba(0, 0, 0, 0.05);
  z-index: 100;
  padding: 6px;
  animation: dropdownFadeIn 0.15s ease;
}

@keyframes dropdownFadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.cs-dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-size: 13px;
  color: var(--claude-text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
}

.cs-dropdown-item:hover {
  background: var(--claude-parchment);
  color: var(--claude-text-primary);
}

.cs-dropdown-item.active {
  background: var(--claude-border-warm);
  color: var(--claude-text-primary);
  font-weight: 500;
}

.cs-dropdown-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.cs-dropdown-count {
  margin-left: auto;
  font-size: 12px;
  color: var(--claude-text-tertiary);
}

.cs-dropdown-divider {
  height: 1px;
  background: var(--claude-border-warm);
  margin: 6px 0;
}
</style>
