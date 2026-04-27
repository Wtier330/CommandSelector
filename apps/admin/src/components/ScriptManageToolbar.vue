<script setup lang="ts">
import { ref, watch, computed } from "vue";

const props = defineProps<{
  stats: Record<string, number>;
  sourceDirs: string[];
  formatSourceName: (dir: string) => string;
}>();

const emit = defineEmits<{
  (e: "create"): void;
  (e: "import"): void;
  (e: "update:keyword", value: string): void;
  (e: "update:selectedType", value: string): void;
  (e: "update:selectedSource", value: string): void;
}>();

const searchKeyword = ref("");
const selectedType = ref<string>("all");
const selectedSource = ref<string>("all");

// 获取可用的脚本类型列表
const scriptTypes = computed(() => {
  const types = ["all"];
  Object.keys(props.stats).forEach(key => {
    if (key !== "total" && key !== "all" && props.stats[key] > 0) {
      types.push(key);
    }
  });
  return types;
});

// 格式化类型名称
function formatTypeName(type: string): string {
  const names: Record<string, string> = {
    all: "全部",
    bat: "BAT",
    ps1: "PS1",
    vbs: "VBS",
    sh: "Shell",
    py: "Python"
  };
  return names[type] || type.toUpperCase();
}

// 监听变化并 emit
watch(searchKeyword, (val) => emit("update:keyword", val));
watch(selectedType, (val) => emit("update:selectedType", val));
watch(selectedSource, (val) => emit("update:selectedSource", val));
</script>

<template>
  <div class="cs-toolbar">
    <div class="cs-toolbar-left">
      <button class="cs-btn cs-btn-primary cs-btn-sm" type="button" @click="emit('create')">
        新建
      </button>
      <button class="cs-btn cs-btn-outline cs-btn-sm" type="button" @click="emit('import')">
        导入
      </button>
    </div>
    <div class="cs-toolbar-right">
      <input v-model="searchKeyword" class="cs-input" placeholder="搜索脚本..." />
      <select v-model="selectedType" class="cs-select cs-select-type">
        <option v-for="type in scriptTypes" :key="type" :value="type">
          {{ formatTypeName(type) }} ({{ props.stats[type] || 0 }})
        </option>
      </select>
      <select v-if="sourceDirs.length > 0" v-model="selectedSource" class="cs-select">
        <option value="all">所有来源</option>
        <option v-for="dir in sourceDirs" :key="dir" :value="dir">
          {{ formatSourceName(dir) }}
        </option>
      </select>
    </div>
  </div>
</template>

<style scoped>
.cs-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--claude-border-warm, #e5e7eb);
}

.cs-toolbar-left, .cs-toolbar-right {
  display: flex;
  gap: 10px;
  align-items: center;
}

.cs-btn {
  padding: 8px 16px;
  border-radius: var(--claude-radius-sm, 6px);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid;
  transition: all 0.2s ease;
}

.cs-btn-sm {
  padding: 6px 12px;
  font-size: 13px;
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
  background: var(--claude-ivory, white);
  color: var(--claude-text-primary, #374151);
  border-color: var(--claude-border-warm, #d1d5db);
}

.cs-btn-outline:hover {
  background: var(--claude-parchment, #f9fafb);
  border-color: var(--claude-text-tertiary, #9ca3af);
}

.cs-input {
  padding: 8px 12px;
  border: 1px solid var(--claude-border-warm, #d1d5db);
  border-radius: var(--claude-radius-sm, 6px);
  font-size: 14px;
  background: var(--claude-ivory, white);
  transition: all 0.2s ease;
}

.cs-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.cs-select {
  padding: 8px 12px;
  border: 1px solid var(--claude-border-warm, #d1d5db);
  border-radius: var(--claude-radius-sm, 6px);
  font-size: 13px;
  background: var(--claude-ivory, white);
  cursor: pointer;
  transition: all 0.2s ease;
}

.cs-select-type {
  min-width: 120px;
  max-width: 160px;
}

.cs-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>
