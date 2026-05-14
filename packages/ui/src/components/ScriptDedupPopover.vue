<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import type { ScriptFileMeta } from "@commandselector/shared";

const props = defineProps<{
  scripts: ScriptFileMeta[];
  currentId: string;
  triggerRect?: DOMRect | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "exclude", id: string): void;
}>();

const popoverRef = ref<HTMLElement | null>(null);
const popoverStyle = computed(() => {
  if (!props.triggerRect) return { visibility: "hidden" } as const;
  const rect = props.triggerRect;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const popoverWidth = 360;
  const popoverHeight = Math.min((props.scripts.length * 72) + 56, 400);
  const gap = 6;

  let left = rect.left;
  let top = rect.bottom + gap;

  if (left + popoverWidth > vw - 8) {
    left = rect.right - popoverWidth;
  }
  if (left < 8) left = 8;

  if (top + popoverHeight > vh - 8 && rect.top - popoverHeight - gap > 0) {
    top = rect.top - popoverHeight - gap;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return {
    position: "fixed",
    left: `${left}px`,
    top: `${top}px`,
    minWidth: `${Math.min(popoverWidth, vw - 16)}px`,
    maxWidth: `${Math.min(popoverWidth, vw - 16)}px`,
  } as any;
});

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    bat: "BAT", ps1: "PS1", vbs: "VBS",
    sh: "SH", cmd: "CMD", py: "PY"
  };
  return labels[type] || type.toUpperCase();
}

function getSourceDisplay(script: ScriptFileMeta): string {
  const dir = script.sourceDir;
  if (!dir) return script.sourcePath ? script.sourcePath.replace(/\\/g, "/").split("/").slice(-2).join("/") : "";
  // 展示最后两级目录，帮助区分同名脚本
  const normalized = dir.replace(/\\/g, "/");
  const parts = normalized.split("/").filter(Boolean);
  return parts.slice(-2).join("/") || normalized;
}

function getDescription(script: ScriptFileMeta): string {
  return script.metadata?.shortDescription
    || script.metadata?.description
    || script.description
    || "";
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function handleClickOutside(e: MouseEvent) {
  if (popoverRef.value && !popoverRef.value.contains(e.target as Node)) {
    emit("close");
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") {
    emit("close");
  }
}

onMounted(() => {
  nextTick(() => {
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeydown);
  });
});

onBeforeUnmount(() => {
  document.removeEventListener("mousedown", handleClickOutside);
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <teleport to="body">
    <Transition name="cs-dedup-fade">
      <div ref="popoverRef" class="cs-dedup-popover" :style="popoverStyle">
        <div class="cs-dedup-popover-header">
          <span class="cs-dedup-popover-title">同名脚本 ({{ scripts.length }})</span>
          <button class="cs-dedup-popover-close" type="button" @click="emit('close')">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="cs-dedup-popover-list">
          <div
            v-for="script in scripts"
            :key="script.id"
            class="cs-dedup-item"
            :class="{ 'is-current': script.id === currentId }"
          >
            <div class="cs-dedup-item-body">
              <div class="cs-dedup-item-meta">
                <span class="cs-dedup-item-type">{{ getTypeLabel(script.type) }}</span>
                <span class="cs-dedup-item-size">{{ formatSize(script.size) }}</span>
                <span v-if="script.sourceDir" class="cs-dedup-item-source" :title="script.sourceDir">{{ getSourceDisplay(script) }}</span>
              </div>
              <div v-if="getDescription(script)" class="cs-dedup-item-desc">{{ getDescription(script) }}</div>
              <div v-else class="cs-dedup-item-desc cs-dedup-item-desc--empty">暂无描述</div>
            </div>
            <button
              class="cs-dedup-item-exclude"
              type="button"
              title="仅隐藏同名提示，不会删除脚本"
              @click="emit('exclude', script.id)"
            >
              忽略
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </teleport>
</template>

<style scoped>
.cs-dedup-popover {
  z-index: 1000;
  background: var(--cs-card, #faf9f5);
  border: 1px solid var(--cs-border, #e5e7eb);
  border-radius: 10px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  padding: 12px;
}

.cs-dedup-popover-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--claude-border-warm, #e5e7eb);
}

.cs-dedup-popover-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--cs-text, #0f172a);
}

.cs-dedup-popover-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--cs-muted, #6b7280);
  padding: 2px;
  display: flex;
  border-radius: 4px;
}

.cs-dedup-popover-close:hover {
  background: var(--claude-border-warm, #f0eee6);
  color: var(--cs-text, #0f172a);
}

.cs-dedup-popover-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cs-dedup-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 8px 8px;
  border-radius: 6px;
  gap: 8px;
}

.cs-dedup-item:hover {
  background: var(--claude-parchment, #f5f4ed);
}

.cs-dedup-item.is-current {
  background: var(--claude-border-warm, #f0eee6);
}

.cs-dedup-item-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cs-dedup-item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--cs-muted, #6b7280);
}

.cs-dedup-item-type {
  font-weight: 600;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--claude-border-warm, #f0eee6);
  color: var(--cs-text, #0f172a);
  flex-shrink: 0;
}

.cs-dedup-item-size {
  color: var(--cs-muted-2, #9ca3af);
  flex-shrink: 0;
}

.cs-dedup-item-source {
  color: var(--cs-muted-2, #9ca3af);
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cs-dedup-item-desc {
  font-size: 12px;
  color: var(--cs-text, #374151);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cs-dedup-item-desc--empty {
  color: var(--cs-muted, #9ca3af);
  font-style: italic;
}

.cs-dedup-item-exclude {
  background: none;
  border: 1px solid transparent;
  cursor: pointer;
  color: var(--cs-muted, #6b7280);
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  flex-shrink: 0;
  white-space: nowrap;
  margin-top: 1px;
}

.cs-dedup-item-exclude:hover {
  border-color: var(--claude-border-warm, #e5e7eb);
  background: var(--claude-parchment, #f5f4ed);
  color: var(--cs-muted-2, #9ca3af);
}

/* 进出动画 */
.cs-dedup-fade-enter-active,
.cs-dedup-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.cs-dedup-fade-enter-from,
.cs-dedup-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
