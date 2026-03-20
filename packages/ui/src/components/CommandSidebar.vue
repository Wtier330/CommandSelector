<script setup lang="ts">
import type { CommandEntry } from "@commandselector/shared";
import CategoryMultiSelect from "./CategoryMultiSelect.vue";

defineProps<{
  categories: string[];
  filteredCommands: CommandEntry[];
  selectedId: string | null;
  keyword: string;
  selectedCategories: string[];
}>();

const emit = defineEmits<{
  (e: "update:keyword", value: string): void;
  (e: "update:selectedCategories", value: string[]): void;
  (e: "select", id: string): void;
  (e: "create"): void;
  (e: "import"): void;
  (e: "export"): void;
}>();

function selectCommand(id: string) {
  emit("select", id);
}
</script>

<template>
  <div class="cs-sidebar-content">
    <div class="cs-search">
      <span class="cs-search-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" stroke-width="2" />
          <path d="M16.2 16.2 21 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </span>
      <input
        class="cs-input"
        placeholder="搜索命令 (Ctrl+/)"
        :value="keyword"
        @input="emit('update:keyword', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="cs-section">
      <div class="cs-section-title">分类</div>
      <CategoryMultiSelect
        :categories="categories"
        :model-value="selectedCategories"
        @update:model-value="emit('update:selectedCategories', $event)"
      />
    </div>

    <div class="cs-section cs-list-section">
      <div class="cs-section-header">
        <div class="cs-section-title">命令</div>
        <div class="cs-sidebar-actions">
          <button
            class="cs-btn cs-btn-outline cs-btn-sm"
            type="button"
            title="导入"
            @click="$emit('import')"
          >
            导入
          </button>
          <button
            class="cs-btn cs-btn-outline cs-btn-sm"
            type="button"
            title="导出"
            @click="$emit('export')"
          >
            导出
          </button>
          <button
            class="cs-btn cs-btn-primary cs-btn-sm"
            type="button"
            @click="$emit('create')"
          >
            添加
          </button>
        </div>
      </div>

      <div class="cs-list">
        <button
          v-for="c in filteredCommands"
          :key="c.id"
          class="cs-item"
          :class="{ 'is-selected': selectedId === c.id }"
          type="button"
          @click="selectCommand(c.id)"
        >
          <div class="cs-item-top">
            <div class="cs-item-title">{{ c.name }}</div>
            <span v-if="c.engine" class="cs-badge">
              {{ c.engine === 'cmd' ? 'CMD' : 'PS' }}
            </span>
          </div>
          <div v-if="c.description" class="cs-item-desc">{{ c.description }}</div>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import "../styles/sidebar.css";
</style>
