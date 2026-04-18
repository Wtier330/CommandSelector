<script setup lang="ts">
import { ref, watch } from "vue";

defineProps<{
  stats: { batCount: number; ps1Count: number; total: number };
}>();

const emit = defineEmits<{
  (e: "create"): void;
  (e: "import"): void;
  (e: "update:keyword", value: string): void;
  (e: "update:selectedType", value: "all" | "bat" | "ps1"): void;
}>();

const searchKeyword = ref("");
const selectedType = ref<"all" | "bat" | "ps1">("all");

// 监听变化并 emit
watch(searchKeyword, (val) => emit("update:keyword", val));
watch(selectedType, (val) => emit("update:selectedType", val));
</script>

<template>
  <div class="cs-toolbar">
    <div class="cs-toolbar-left">
      <button class="cs-btn cs-btn-primary" type="button" @click="emit('create')">
        新建脚本
      </button>
      <button class="cs-btn cs-btn-outline" type="button" @click="emit('import')">
        导入
      </button>
    </div>
    <div class="cs-toolbar-right">
      <input v-model="searchKeyword" class="cs-input" placeholder="搜索脚本..." />
      <div class="cs-filter-buttons">
        <button
          class="cs-filter-btn"
          :class="{ active: selectedType === 'all' }"
          type="button"
          @click="selectedType = 'all'"
        >
          全部 ({{ stats.total }})
        </button>
        <button
          class="cs-filter-btn"
          :class="{ active: selectedType === 'bat' }" 
          type="button"
          @click="selectedType = 'bat'"
        >
          BAT ({{ stats.batCount }})
        </button>
        <button
          class="cs-filter-btn"
          :class="{ active: selectedType === 'ps1' }"
          type="button"
          @click="selectedType = 'ps1'"
        >
          PS1 ({{ stats.ps1Count }})
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cs-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.cs-toolbar-left, .cs-toolbar-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

.cs-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid;
}

.cs-btn-primary {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.cs-btn-primary:hover {
  background: #2563eb;
  border-color: #2563eb;
}

.cs-btn-outline {
  background: white;
  color: #374151;
  border-color: #d1d5db;
}

.cs-btn-outline:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.cs-input {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.cs-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.cs-filter-buttons {
  display: flex;
  gap: 4px;
}

.cs-filter-btn {
  padding: 4px 8px;
  border: none;
  background: transparent;
;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  border-radius: 4px;
}

.cs-filter-btn.active {
  background: #dbeafe;
  color: #1d4ed8;
}
</style>
