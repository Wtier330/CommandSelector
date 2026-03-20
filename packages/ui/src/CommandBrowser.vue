<script setup lang="ts">
import { computed, ref, watch, toRefs } from "vue";
import type { CommandEntry } from "@commandselector/shared";
import { useResponsiveLayout, type ResponsiveOptions } from "./composables/useResponsiveLayout";
import { useCommandFilter } from "./composables/useCommandFilter";
import { useCommandParams } from "./composables/useCommandParams";

import CommandSidebar from "./components/CommandSidebar.vue";
import CommandPreview from "./components/CommandPreview.vue";
import ParameterForm from "./components/ParameterForm.vue";
import UsageInstruction from "./components/UsageInstruction.vue";
import ToastNotification from "./components/ToastNotification.vue";
import BottomStatusBar from "./components/BottomStatusBar.vue";

const props = defineProps<{
  commands: CommandEntry[];
  selectedId?: string;
  responsive?: ResponsiveOptions;
}>();

const emit = defineEmits<{
  (e: "select", id: string): void;
  (e: "create"): void;
  (e: "edit", id: string): void;
  (e: "import"): void;
  (e: "export"): void;
}>();

const { commands } = toRefs(props);

// 1. 响应式布局
const rootEl = ref<HTMLElement | null>(null);
const responsiveOptions = computed<ResponsiveOptions>(() => ({
  minWidth: 800,
  minHeight: 600,
  scaleMin: 0.8,
  scaleMax: 1.2,
  scaleUp: false,
  ...(props.responsive ?? {}),
}));

const { breakpoint, heightLevel, scale } = useResponsiveLayout(
  rootEl,
  responsiveOptions
);

const isNarrow = computed(() => false); // 强制关闭窄屏模式

const navOpen = ref(false);

const mainEl = ref<HTMLElement | null>(null);

// 2. 过滤与列表
const { keyword, selectedCategories, categories, filteredCommands } = useCommandFilter(commands);

// 3. 选择逻辑
const internalSelectedId = ref<string>(props.selectedId ?? "");
watch(
  () => props.selectedId,
  (newVal: string | undefined) => {
    internalSelectedId.value = newVal ?? "";
  },
  { immediate: true, flush: "sync" }
);

const selected = computed(() => {
  const id = internalSelectedId.value;
  return props.commands.find((c) => c.id === id) ?? filteredCommands.value[0] ?? null;
});

function handleSelect(id: string) {
  internalSelectedId.value = id;
  emit("select", id);
  if (isNarrow.value) {
    navOpen.value = false;
  }
  if (mainEl.value) {
    mainEl.value.scrollTo({ top: 0, behavior: "smooth" });
  }
}

// 4. 参数与命令生成
const {
  paramDefs,
  paramValues,
  paramErrors,
  finalCommand,
  finalValidation,
  canCopy,
} = useCommandParams(selected);

function updateParam(key: string, value: string | boolean) {
  paramValues.value[key] = value;
}

// 5. 复制与提示
const toast = ref<{ text: string; kind: "success" | "error" } | null>(null);
let toastTimer: ReturnType<typeof setTimeout> | null = null;

function showToast(text: string, kind: "success" | "error") {
  toast.value = { text, kind };
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastTimer = null;
    toast.value = null;
  }, 1400);
}

async function handleCopy(text?: string) {
  const t = text ?? finalCommand.value;
  if (!canCopy.value) {
    showToast("请先修正参数或命令", "error");
    return;
  }
  try {
    await navigator.clipboard.writeText(t);
    showToast("已复制", "success");
  } catch {
    showToast("复制失败", "error");
  }
}

// 6. 交互状态
const usageCollapsible = computed(() => {
  const bp = breakpoint.value;
  return bp === "M" || bp === "S" || bp === "XS" || heightLevel.value !== "H2";
});
</script>

<template>
  <div
    ref="rootEl"
    class="cs-root"
    :data-bp="breakpoint"
    :data-h="heightLevel"
    :style="{ '--cs-scale': String(scale) }"
  >
    <div class="cs-canvas-container">
      <div class="cs-canvas">
        <div class="cs-shell" :class="{ 'is-narrow': isNarrow }">
          
          <!-- Sidebar Navigation -->
        <aside v-if="!isNarrow" class="cs-sidebar">
          <CommandSidebar
            :categories="categories"
            :filtered-commands="filteredCommands"
            :selected-id="selected?.id ?? null"
            v-model:keyword="keyword"
            v-model:selected-categories="selectedCategories"
            @select="handleSelect"
            @create="$emit('create')"
            @import="$emit('import')"
            @export="$emit('export')"
          />
        </aside>

        <!-- Main Content Area -->
        <main ref="mainEl" class="cs-main">
          <!-- Mobile Top Bar -->
          <div v-if="isNarrow" class="cs-narrow-top">
            <button class="cs-btn cs-btn-outline cs-btn-sm" type="button" @click="navOpen = true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
              命令列表
            </button>
            <div class="cs-narrow-title">{{ selected?.name ?? "请选择命令" }}</div>
          </div>

          <!-- Empty State -->
          <div v-if="!selected" class="cs-empty">
            <div class="cs-empty-icon">⌘</div>
            <div class="cs-empty-text">请在左侧选择一条命令以开始配置</div>
          </div>
          
          <!-- Content State -->
          <div v-else class="cs-content">
            <div class="cs-view-panel">
              <!-- 1. 命令标题 -->
              <header class="cs-view-section cs-header-section">
                <div class="cs-title-row">
                  <div class="cs-title-main">
                    <h1 class="cs-title">{{ selected.name }}</h1>
                  </div>
                  <div class="cs-actions">
                  <button
                    class="cs-btn cs-btn-outline"
                    type="button"
                    @click="$emit('edit', selected.id)"
                  >
                    编辑命令
                  </button>
                  </div>
                </div>
                <p v-if="selected.description" class="cs-subtitle">{{ selected.description }}</p>
                <div v-if="selected.tags?.length" class="cs-tags cs-tags-lg" style="margin-top: 16px;">
                  <span v-for="t in selected.tags" :key="t" class="cs-tag cs-tag-lg">{{ t }}</span>
                </div>
              </header>

              <!-- 2. 最终命令预览（核心区域） -->
              <section class="cs-view-section cs-preview-section">
                <CommandPreview
                  :final-command="finalCommand"
                  :can-copy="canCopy"
                  :validation-ok="finalValidation.ok"
                  :validation-reasons="finalValidation.reasons"
                  @copy="handleCopy()"
                />
              </section>

              <!-- 3. 参数配置 -->
              <section v-if="paramDefs.length" class="cs-view-section cs-params-section">
                <h2 class="cs-section-title-text cs-params-header">参数配置</h2>
                <ParameterForm
                  :param-defs="paramDefs"
                  :param-values="paramValues"
                  :param-errors="paramErrors"
                  @update:paramValue="updateParam"
                />
              </section>

              <!-- 4. 使用说明 -->
              <section v-if="selected.usage" class="cs-view-section cs-usage-wrapper">
                <UsageInstruction
                  :usage="selected.usage"
                  :collapsible="usageCollapsible"
                />
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
    </div>

    <!-- Mobile Drawer -->
    <div v-if="navOpen" class="cs-overlay" @click="navOpen = false">
      <div class="cs-drawer" @click.stop>
        <div class="cs-drawer-head">
          <div class="cs-drawer-title">命令列表</div>
          <button class="cs-btn cs-btn-outline cs-btn-sm" type="button" @click="navOpen = false">关闭</button>
        </div>
        <div class="cs-drawer-body">
          <CommandSidebar
            :categories="categories"
            :filtered-commands="filteredCommands"
            :selected-id="selected?.id ?? null"
            v-model:keyword="keyword"
            v-model:selected-categories="selectedCategories"
            @select="handleSelect"
            @create="$emit('create')"
            @import="$emit('import')"
            @export="$emit('export')"
          />
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <ToastNotification :toast="toast" />
    
    <BottomStatusBar />
  </div>
</template>

<style>
@import "./styles/variables.css";
@import "./styles/layout.css";
@import "./styles/components.css";

/* Breakpoint specific adjustments that need global scope */
.cs-root[data-bp="M"] .cs-tags-lg,
.cs-root[data-bp="S"] .cs-tags-lg,
.cs-root[data-bp="XS"] .cs-tags-lg {
  max-height: 36px;
  overflow: hidden;
}

.cs-root[data-bp="M"] .cs-code,
.cs-root[data-bp="S"] .cs-code,
.cs-root[data-bp="XS"] .cs-code {
  padding: 16px;
}

.cs-root[data-h="H1"] .cs-subtitle,
.cs-root[data-h="XS"] .cs-subtitle {
  display: none;
}
</style>
