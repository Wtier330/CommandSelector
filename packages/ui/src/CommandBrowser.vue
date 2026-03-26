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
  trashedCommands?: CommandEntry[];
  selectedId?: string;
  responsive?: ResponsiveOptions;
}>();

const emit = defineEmits<{
  (e: "select", id: string): void;
  (e: "create"): void;
  (e: "edit", id: string): void;
  (e: "update:command", command: CommandEntry): void;
  (e: "delete", id: string): void;
  (e: "restore-trash", id: string): void;
  (e: "delete-permanently", id: string): void;
  (e: "empty-trash"): void;
}>();

const { commands, trashedCommands } = toRefs(props);

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
  if (!canCopy.value) {
    showToast("请先修正参数或命令", "error");
    return;
  }
  showToast("已复制", "success");
}

// 6. 交互状态
const usageCollapsible = computed(() => {
  const bp = breakpoint.value;
  return bp === "M" || bp === "S" || bp === "XS" || heightLevel.value !== "H2";
});

const isCommandEditing = ref(false);
const draftCommand = ref<CommandEntry | null>(null);

function startCommandEdit() {
  if (!selected.value) return;
  draftCommand.value = JSON.parse(JSON.stringify(selected.value));
  isCommandEditing.value = true;
}

function cancelCommandEdit() {
  isCommandEditing.value = false;
  draftCommand.value = null;
}

function saveCommandEdit() {
  if (!draftCommand.value) return;
  if (!draftCommand.value.name.trim()) {
    showToast("命令名称不能为空", "error");
    return;
  }
  if (!draftCommand.value.template.trim()) {
    showToast("命令模板不能为空", "error");
    return;
  }
  emit("update:command", draftCommand.value);
  isCommandEditing.value = false;
  showToast("保存成功", "success");
}

function handleDeleteCommand() {
  if (!selected.value) return;
  emit("delete", selected.value.id);
  internalSelectedId.value = "";
  showToast("删除成功", "success");
}

watch(
  () => selected.value?.id,
  () => {
    isCommandEditing.value = false;
  }
);

const draftTagsStr = computed({
  get() {
    return draftCommand.value?.tags?.join(", ") ?? "";
  },
  set(val: string) {
    if (draftCommand.value) {
      draftCommand.value.tags = val.split(",").map(s => s.trim()).filter(Boolean);
    }
  }
});

defineExpose({
  startEdit: startCommandEdit
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
        <aside v-if="!isNarrow" class="cs-sidebar">
          <CommandSidebar
            :categories="categories"
            :filtered-commands="filteredCommands"
            :selected-id="selected?.id ?? null"
            :trashed-commands="trashedCommands"
            v-model:keyword="keyword"
            v-model:selected-categories="selectedCategories"
            @select="handleSelect"
            @create="$emit('create')"
            @restore-trash="$emit('restore-trash', $event)"
            @delete-permanently="$emit('delete-permanently', $event)"
            @empty-trash="$emit('empty-trash')"
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
              <header v-if="selected || isCommandEditing" class="cs-view-section cs-header-section">
                <template v-if="!isCommandEditing && selected">
                  <div class="cs-title-row">
                    <div class="cs-title-main">
                      <h1 class="cs-title">{{ selected.name }}</h1>
                    </div>
                    <div class="cs-actions">
                    <button
                      class="cs-btn-icon cs-btn-edit-entry"
                      type="button"
                      title="编辑命令"
                      @click="startCommandEdit"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0 -2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2 -2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1 1 4 9.5-9.5-9.5z"></path>
                      </svg>
                      <span>编辑</span>
                    </button>
                    <button
                      class="cs-btn-icon cs-btn-delete-entry"
                      type="button"
                      title="删除命令"
                      @click="handleDeleteCommand"
                    >
                      <svg t="1774535411098" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="8973" width="16" height="16"><path d="M128 320l0 640c0 35.20512 28.79488 64 64 64l576 0c35.20512 0 64-28.79488 64-64l0-640-704 0zM320 896l-64 0 0-448 64 0 0 448zM448 896l-64 0 0-448 64 0 0 448zM576 896l-64 0 0-448 64 0 0 448zM704 896l-64 0 0-448 64 0 0 448z" fill="#444444" p-id="8974"></path><path d="M847.99488 128l-207.99488 0 0-79.99488c0-26.39872-21.6064-48.00512-48.00512-48.00512l-224.01024 0c-26.39872 0-48.00512 21.6064-48.00512 48.00512l0 79.99488-207.99488 0c-26.39872 0-48.00512 21.6064-48.00512 48.00512l0 79.99488 832 0 0-79.99488c0-26.39872-21.6064-48.00512-48.00512-48.00512zM576 128l-192 0 0-63.20128 192 0 0 63.20128z" fill="#444444" p-id="8975"></path></svg>
                      <span>删除</span>
                    </button>
                    </div>
                  </div>
                  <p v-if="selected.description" class="cs-subtitle">{{ selected.description }}</p>
                  <div v-if="selected.tags?.length" class="cs-tags cs-tags-lg" style="margin-top: 16px;">
                    <span v-for="t in selected.tags" :key="t" class="cs-tag cs-tag-lg">{{ t }}</span>
                  </div>
                </template>

                <template v-else-if="draftCommand">
                  <div class="cs-title-row" style="margin-bottom: 16px;">
                    <h1 class="cs-title" style="font-size: 18px;">编辑基本信息</h1>
                    <div class="cs-actions" style="display: flex; gap: 12px;">
                      <button class="cs-btn cs-btn-outline" @click="cancelCommandEdit">取消</button>
                      <button class="cs-btn cs-btn-primary" @click="saveCommandEdit">完成</button>
                    </div>
                  </div>
                  <div class="cs-command-edit-grid">
                    <label class="cs-field-col">
                      <span class="cs-field-label">命令名称 <span style="color:#ef4444">*</span></span>
                      <input v-model="draftCommand.name" class="cs-input cs-input-sm" placeholder="必填" />
                    </label>
                    <label class="cs-field-col">
                      <span class="cs-field-label">分类</span>
                      <input v-model="draftCommand.category" class="cs-input cs-input-sm" placeholder="例如: 系统维护" />
                    </label>
                    <label class="cs-field-col">
                      <span class="cs-field-label">执行引擎</span>
                      <select v-model="draftCommand.engine" class="cs-input cs-input-sm">
                        <option value="cmd">CMD</option>
                        <option value="cmd+powershell">混合 (CMD+PowerShell)</option>
                      </select>
                    </label>
                    <label class="cs-field-col">
                      <span class="cs-field-label">适用平台</span>
                      <select v-model="draftCommand.platform" class="cs-input cs-input-sm">
                        <option value="windows">Windows</option>
                        <option value="macos">macOS</option>
                        <option value="linux">Linux</option>
                        <option value="any">不限</option>
                      </select>
                    </label>
                    <label class="cs-field-col" style="grid-column: 1 / -1;">
                      <span class="cs-field-label">描述</span>
                      <input v-model="draftCommand.description" class="cs-input cs-input-sm" placeholder="一句话描述用途" />
                    </label>
                    <label class="cs-field-col" style="grid-column: 1 / -1;">
                      <span class="cs-field-label">标签 (逗号分隔)</span>
                      <input v-model="draftTagsStr" class="cs-input cs-input-sm" placeholder="例如: 网络, 进程, 维护" />
                    </label>
                  </div>
                </template>
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

              <!-- 2.5 模板编辑 (Only in edit mode) -->
              <section v-if="isCommandEditing && draftCommand" class="cs-view-section cs-template-edit-section">
                <h2 class="cs-section-title-text cs-params-header">编辑模板 <span style="color:#ef4444">*</span></h2>
                <textarea
                  v-model="draftCommand.template"
                  class="cs-input cs-textarea"
                  rows="3"
                  placeholder="使用 {{参数名}} 作为占位符，如：ping {{target}} -n {{count}}"
                ></textarea>
              </section>

              <!-- 3. 参数配置 -->
              <section v-if="selected" class="cs-view-section cs-params-section">
                <ParameterForm
                  :command="selected"
                  :param-defs="paramDefs"
                  :param-values="paramValues"
                  :param-errors="paramErrors"
                  @update:paramValue="updateParam"
                  @update:command="$emit('update:command', $event)"
                />
              </section>

              <!-- 4. 使用说明 -->
              <section v-if="selected?.usage || isCommandEditing" class="cs-view-section cs-usage-wrapper">
                <template v-if="isCommandEditing && draftCommand">
                  <h2 class="cs-section-title-text cs-params-header">编辑使用说明</h2>
                  <textarea
                    v-model="draftCommand.usage"
                    class="cs-input cs-textarea"
                    rows="4"
                    placeholder="补充说明或注意事项"
                  ></textarea>
                </template>
                <template v-else-if="selected">
                  <UsageInstruction
                    :usage="selected.usage"
                    :collapsible="usageCollapsible"
                  />
                </template>
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
        <div class="cs-drawer-body">
          <CommandSidebar
            :categories="categories"
            :filtered-commands="filteredCommands"
            :selected-id="selected?.id ?? null"
            :trashed-commands="trashedCommands"
            v-model:keyword="keyword"
            v-model:selected-categories="selectedCategories"
            @select="handleSelect"
            @create="$emit('create')"
            @import="$emit('import')"
            @export="$emit('export')"
          />
        </div>
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
.cs-root[data-bp="M"] .cs-tags-tags-lg,
.cs-root[data-bp="S"] .cs-tags-tags-lg,
.cs-root[data-bp="XS"] .cs-tags-tags-lg {
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
