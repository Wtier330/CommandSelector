<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";

const props = defineProps<{
  categories: string[];
  modelValue: string[];
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string[]): void;
}>();

const isOpen = ref(false);
const containerRef = ref<HTMLElement | null>(null);
const listboxRef = ref<HTMLElement | null>(null);
const focusedIndex = ref<number>(-1);
const dropdownStyle = ref<Record<string, string>>({});

// 计算可用空间，动态调整弹出位置和高度
function updateDropdownPosition() {
  if (!isOpen.value || !containerRef.value || !listboxRef.value) return;

  const triggerRect = containerRef.value.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  const spaceBelow = windowHeight - triggerRect.bottom;
  const spaceAbove = triggerRect.top;

  // 默认最大高度
  let maxHeight = 240;
  let isUpward = false;

  // 如果下方空间不足 150px 且上方空间更大，则向上弹出
  if (spaceBelow < 150 && spaceAbove > spaceBelow) {
    isUpward = true;
    maxHeight = Math.min(240, spaceAbove - 16); // 预留16px边距
  } else {
    maxHeight = Math.min(240, spaceBelow - 16);
  }

  if (isUpward) {
    dropdownStyle.value = {
      bottom: "calc(100% + 4px)",
      top: "auto",
      maxHeight: `${maxHeight}px`
    };
  } else {
    dropdownStyle.value = {
      top: "calc(100% + 4px)",
      bottom: "auto",
      maxHeight: `${maxHeight}px`
    };
  }
}

// 监听窗口大小和滚动变化
function handleWindowChange() {
  if (isOpen.value) {
    updateDropdownPosition();
  }
}

// 选项列表：包括一个 "全选/取消全选" 的特殊项
const options = computed(() => {
  return props.categories;
});

const isAllSelected = computed(() => {
  return props.modelValue.includes("__all__") || props.modelValue.length === props.categories.length;
});

const isSomeSelected = computed(() => {
  return !isAllSelected.value && props.modelValue.length > 0 && !props.modelValue.includes("__none__");
});

const displayValue = computed(() => {
  if (isAllSelected.value) {
    return "全部命令";
  }
  if (props.modelValue.length === 0 || props.modelValue.includes("__none__")) {
    return "请选择分类";
  }
  if (props.modelValue.length === 1) {
    return props.modelValue[0];
  }
  return `已选 ${props.modelValue.length} 项`;
});

function toggleDropdown() {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    focusedIndex.value = -1;
    nextTick(() => {
      updateDropdownPosition();
      listboxRef.value?.focus();
    });
  }
}

function closeDropdown() {
  isOpen.value = false;
  focusedIndex.value = -1;
}

function toggleCategory(cat: string) {
  let current = [...props.modelValue];
  
  if (current.includes("__all__")) {
    // If it was "All", and we uncheck one, it becomes all EXCEPT this one
    current = props.categories.filter(c => c !== cat);
  } else if (current.includes("__none__")) {
    current = [cat];
  } else {
    const idx = current.indexOf(cat);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(cat);
    }
  }

  if (current.length === props.categories.length) {
    emit("update:modelValue", ["__all__"]);
  } else if (current.length === 0) {
    emit("update:modelValue", ["__none__"]); // Special value to represent empty selection
  } else {
    emit("update:modelValue", current);
  }
}

function toggleAll() {
  if (isAllSelected.value) {
    emit("update:modelValue", ["__none__"]);
  } else {
    emit("update:modelValue", ["__all__"]);
  }
}

function isSelected(cat: string) {
  if (isAllSelected.value) return true;
  return props.modelValue.includes(cat);
}

// Click outside to close
function handleClickOutside(event: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    closeDropdown();
  }
}

onMounted(() => {
  document.addEventListener("mousedown", handleClickOutside);
  window.addEventListener("resize", handleWindowChange, { passive: true });
  window.addEventListener("scroll", handleWindowChange, { passive: true, capture: true });
});

onBeforeUnmount(() => {
  document.removeEventListener("mousedown", handleClickOutside);
  window.removeEventListener("resize", handleWindowChange);
  window.removeEventListener("scroll", handleWindowChange, { capture: true });
});

// Keyboard navigation
function handleKeyDown(event: KeyboardEvent) {
  if (!isOpen.value) {
    if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
      event.preventDefault();
      toggleDropdown();
    }
    return;
  }

  const maxIndex = options.value.length; // +1 for "Select All" at index 0

  if (event.key === "Escape") {
    event.preventDefault();
    closeDropdown();
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    focusedIndex.value = (focusedIndex.value + 1) % (maxIndex + 1);
    scrollToFocused();
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    focusedIndex.value = (focusedIndex.value - 1 + (maxIndex + 1)) % (maxIndex + 1);
    scrollToFocused();
  } else if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    if (focusedIndex.value === 0) {
      toggleAll();
    } else if (focusedIndex.value > 0) {
      toggleCategory(options.value[focusedIndex.value - 1]);
    }
  } else if (event.key === "Tab") {
    closeDropdown();
  }
}

function scrollToFocused() {
  nextTick(() => {
    if (!listboxRef.value) return;
    const items = listboxRef.value.querySelectorAll('.cs-select-item');
    if (focusedIndex.value >= 0 && focusedIndex.value < items.length) {
      (items[focusedIndex.value] as HTMLElement).scrollIntoView({ block: 'nearest' });
    }
  });
}
</script>

<template>
  <div class="cs-select" ref="containerRef" @keydown="handleKeyDown">
    <div class="cs-select-trigger" :class="{ 'is-open': isOpen }" @click="toggleDropdown" tabindex="0">
      <div class="cs-select-value" :class="{ 'is-placeholder': displayValue === '请选择分类' }">
        {{ displayValue }}
      </div>
      <div class="cs-select-icon">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
    </div>

    <Transition name="cs-dropdown">
      <div v-if="isOpen" class="cs-select-dropdown" ref="listboxRef" tabindex="-1" :style="dropdownStyle">
        <div class="cs-select-list">
          <div 
            class="cs-select-item" 
            :class="{ 'is-focused': focusedIndex === 0 }"
            @click="toggleAll"
            @mouseenter="focusedIndex = 0"
          >
            <div class="cs-checkbox" :class="{ 'is-checked': isAllSelected, 'is-indeterminate': isSomeSelected }">
              <svg v-if="isAllSelected" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <svg v-else-if="isSomeSelected" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
            <span class="cs-select-item-text">全部命令</span>
          </div>

          <div 
            v-for="(cat, index) in options" 
            :key="cat"
            class="cs-select-item"
            :class="{ 'is-focused': focusedIndex === index + 1 }"
            @click="toggleCategory(cat)"
            @mouseenter="focusedIndex = index + 1"
          >
            <div class="cs-checkbox" :class="{ 'is-checked': isSelected(cat) }">
              <svg v-if="isSelected(cat)" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <span class="cs-select-item-text">{{ cat }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.cs-select {
  position: relative;
  width: 100%;
  box-sizing: border-box;
}

.cs-select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 36px;
  padding: 0 12px;
  background: var(--cs-card);
  border: 1px solid var(--cs-border);
  border-radius: var(--cs-radius-sm);
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
  outline: none;
  box-sizing: border-box;
}

.cs-select-trigger:hover {
  border-color: var(--claude-border-warm);
}

.cs-select-trigger:focus-visible,
.cs-select-trigger.is-open {
  border-color: var(--claude-focus);
  box-shadow: 0 0 0 3px rgba(56, 152, 236, 0.1);
}

.cs-select-value {
  font-size: 13px;
  color: var(--cs-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cs-select-value.is-placeholder {
  color: var(--cs-muted);
}

.cs-select-icon {
  color: var(--cs-muted);
  display: flex;
  transition: transform 0.2s;
}

.cs-select-trigger.is-open .cs-select-icon {
  transform: rotate(180deg);
}

.cs-select-dropdown {
  position: absolute;
  left: 0;
  width: 100%;
  background: var(--cs-card);
  border: 1px solid var(--cs-border);
  border-radius: var(--cs-radius-sm);
  box-shadow: var(--cs-shadow);
  z-index: 50;
  overflow-y: auto;
  outline: none;
  box-sizing: border-box;
}

.cs-select-dropdown::-webkit-scrollbar {
  width: 4px;
}
.cs-select-dropdown::-webkit-scrollbar-thumb {
  background-color: var(--cs-border);
  border-radius: 4px;
}

.cs-select-list {
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cs-select-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s;
  color: var(--claude-text-secondary);
}

.cs-select-item.is-focused,
.cs-select-item:hover {
  background: var(--claude-parchment);
  color: var(--claude-text-primary);
}

.cs-checkbox {
  width: 16px;
  height: 16px;
  border: 1px solid var(--claude-border-warm);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: all 0.2s;
  flex-shrink: 0;
  background: var(--claude-ivory);
}

.cs-checkbox.is-checked,
.cs-checkbox.is-indeterminate {
  background: var(--claude-terracotta);
  border-color: var(--claude-terracotta);
}

.cs-select-item-text {
  font-size: 13px;
  color: var(--cs-text);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Animations */
.cs-dropdown-enter-active,
.cs-dropdown-leave-active {
  transition: opacity 0.2s, transform 0.2s;
  transform-origin: top;
}

.cs-dropdown-enter-from,
.cs-dropdown-leave-to {
  opacity: 0;
  transform: scaleY(0.95);
}
</style>
