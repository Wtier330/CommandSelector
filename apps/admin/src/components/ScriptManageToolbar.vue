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
  (e: "import-folder"): void;
  (e: "update:keyword", value: string): void;
  (e: "update:selectedType", value: string): void;
  (e: "update:selectedSource", value: string): void;
}>();

const searchKeyword = ref("");
const selectedType = ref<string>("all");
const selectedSource = ref<string>("all");
const showImportMenu = ref(false);

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

function formatTypeName(type: string): string {
  const names: Record<string, string> = {
    all: "全部", bat: "BAT", ps1: "PS1",
    vbs: "VBS", sh: "Shell", py: "Python"
  };
  return names[type] || type.toUpperCase();
}

function toggleImportMenu() {
  showImportMenu.value = !showImportMenu.value;
}

function closeImportMenu() {
  showImportMenu.value = false;
}

function handleImportFile() {
  closeImportMenu();
  emit("import");
}

function handleImportFolder() {
  closeImportMenu();
  emit("import-folder");
}

// 监听变化并 emit
watch(searchKeyword, (val) => emit("update:keyword", val));
watch(selectedType, (val) => emit("update:selectedType", val));
watch(selectedSource, (val) => emit("update:selectedSource", val));
</script>

<template>
  <div class="cs-toolbar">
    <!-- 第一行：操作按钮 -->
    <div class="cs-toolbar-row cs-toolbar-actions">
      <button class="cs-btn cs-btn-primary cs-btn-sm" type="button" @click="emit('create')">
        新建
      </button>

      <div class="cs-import-group">
        <button class="cs-btn cs-btn-outline cs-btn-sm cs-import-toggle" type="button" @click="toggleImportMenu">
          导入
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        <Transition name="cs-import-drop">
          <div v-if="showImportMenu" class="cs-import-menu">
            <button class="cs-import-menu-item" type="button" @click="handleImportFile">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              导入文件
            </button>
            <button class="cs-import-menu-item" type="button" @click="handleImportFolder">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              导入文件夹
            </button>
          </div>
        </Transition>
      </div>

      <!-- 点击遮罩关闭菜单 -->
      <div v-if="showImportMenu" class="cs-import-backdrop" @click="closeImportMenu"></div>
    </div>

    <!-- 第二行：筛选条件 -->
    <div class="cs-toolbar-row cs-toolbar-filters">
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
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--claude-border-warm, #e5e7eb);
}

.cs-toolbar-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.cs-toolbar-filters {
  flex-wrap: wrap;
}

/* 导入按钮下拉组 */
.cs-import-group {
  position: relative;
}

.cs-import-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.cs-import-toggle svg {
  transition: transform 0.2s;
}

.cs-import-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 50;
  min-width: 150px;
  background: var(--cs-card, #faf9f5);
  border: 1px solid var(--cs-border, #e5e7eb);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cs-import-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: var(--cs-text, #374151);
  text-align: left;
  transition: background 0.15s;
}

.cs-import-menu-item:hover {
  background: var(--claude-parchment, #f5f4ed);
}

.cs-import-menu-item svg {
  flex-shrink: 0;
  color: var(--cs-muted, #6b7280);
}

.cs-import-backdrop {
  position: fixed;
  inset: 0;
  z-index: 49;
}

/* 下拉动画 */
.cs-import-drop-enter-active,
.cs-import-drop-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
  transform-origin: top left;
}

.cs-import-drop-enter-from,
.cs-import-drop-leave-to {
  opacity: 0;
  transform: scaleY(0.95);
}

/* 按钮样式 */
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
  min-width: 0;
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
