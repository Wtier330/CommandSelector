<script setup lang="ts">
import { computed, ref, watch, toRefs } from "vue";
import type { CommandEntry, ScriptFileMeta } from "@commandselector/shared";
import { useResponsiveLayout, type ResponsiveOptions } from "./composables/useResponsiveLayout";
import { useCommandFilter } from "./composables/useCommandFilter";
import { useCommandParams } from "./composables/useCommandParams";
import { useCommandEdit } from "./composables/useCommandEdit";
import { useCommandAIMetadata } from "./composables/useCommandAIMetadata";

import CommandSidebar from "./components/CommandSidebar.vue";
import CommandPreview from "./components/CommandPreview.vue";
import ParameterForm from "./components/ParameterForm.vue";
import UsageInstruction from "./components/UsageInstruction.vue";
import CommandActionsFrom from "./components/CommandActions.vue";
import CommandEditForm from "./components/CommandEditForm.vue";
import ToastNotification from "./components/ToastNotification.vue";
import BottomStatusBar from "./components/BottomStatusBar.vue";
import ScriptCard from "./components/ScriptCard.vue";

const props = defineProps<{
  commands: CommandEntry[];
  trashedCommands?: CommandEntry[];
  selectedId?: string;
  responsive?: ResponsiveOptions;
  scripts?: ScriptFileMeta[];
  currentMode?: 'command' | 'script';
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
  (e: "import"): void;
  (e: "export"): void;
  (e: "import:command", command: CommandEntry): void;
  (e: "add-category", category: string): void;
  (e: "delete-category", category: string, action: "move" | "clear", targetCategory?: string): void;
  (e: "open-script-manage"): void;
  (e: "update:mode", value: 'command' | 'script'): void;
  (e: "edit-script", id: string): void;
  (e: "more-script", id: string): void;
}>();

const { commands, trashedCommands } = toRefs(props);

// 当前模式（优先使用外部传入，否则使用 localStorage）
const internalMode = ref<'command' | 'script'>(props.currentMode ?? (() => {
  try {
    return (localStorage.getItem('cs-current-mode') as 'command' | 'script') || 'command';
  } catch {
    return 'command';
  }
})());

// 暴露当前模式给父组件
watch(internalMode, (newMode) => {
  try {
    localStorage.setItem('cs-current-mode', newMode);
  } catch {
    // localStorage 不可用时忽略
  }
  emit('update:mode', newMode);
}, { immediate: true });

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

const { breakpoint, heightLevel, scale } = useResponsiveLayout(rootEl, responsiveOptions);

const isNarrow = computed(() => false); // 强制关闭窄屏模式
const navOpen = ref(false);
const mainEl = ref<HTMLElement | null>(null);

// 2. 过滤与列表
const { keyword, selectedCategories, categories, filteredCommands } = useCommandFilter(commands);

// 脚本类型过滤
const selectedScriptType = ref<'all' | 'bat' | 'ps1' | 'vbs' | 'sh' | 'cmd' | 'py'>('all');

// 过滤后的脚本列表
const filteredScripts = computed(() => {
  let result = props.scripts || [];
  if (selectedScriptType.value !== 'all') {
    result = result.filter(s => s.type === selectedScriptType.value);
  }
  if (keyword.value.trim()) {
    const kw = keyword.value.toLowerCase();
    result = result.filter(s =>
      s.name.toLowerCase().includes(kw) ||
      (s.description?.toLowerCase().includes(kw) ?? false)
    );
  }
  return result;
});

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
  powershellTemplate,
} = useCommandParams(selected);

function updateParam(key: string, value: string | boolean) {
  paramValues.value[key] = value;
}

// 5. 命令编辑
const {
  isCommandEditing,
  draftCommand,
  templateEditMode,
  startCommandEdit,
  cancelCommandEdit,
  saveCommandEdit: doSaveCommandEdit
} = useCommandEdit(selected);

// 5.1 AI 补全
const {
  isCompleting,
  isStreaming,
  streamingContent,
  streamingStage,
  isConfigured: isAIConfigured,
  completeMetadataStream,
  loadProviders: loadAIProviders,
  clearError: clearAIError
} = useCommandAIMetadata();

// AI 补全进度步骤
const generatingStep = ref('');

// 初始化时加载 AI 配置
loadAIProviders();

// AI 补全命令元数据
async function handleAICompleteCommand() {
  if (!draftCommand.value) return;

  clearAIError();

  if (!isAIConfigured.value) {
    showToast("请先在设置中配置 AI 服务", "error");
    return;
  }

  const name = draftCommand.value.name;
  const template = draftCommand.value.template;
  const psTemplate = draftCommand.value.powershellTemplate;

  if (!name && !template && !psTemplate) {
    showToast("请先填写命令名称或模板内容", "error");
    return;
  }

  // 优先使用当前模式对应的模板
  // 如果没有，则使用另一个模板
  const currentMode = templateEditMode.value === 'powershell' ? 'powershell' : 'cmd';
  const primaryTemplate = currentMode === 'powershell' ? psTemplate : template;
  const fallbackTemplate = currentMode === 'powershell' ? template : psTemplate;
  // 确保空字符串不会传给 AI
  const sourceTemplate = (primaryTemplate?.trim() || fallbackTemplate?.trim()) || undefined;

  // 构建传递给 AI 的数据（基于可用模板）
  const commandForAI = {
    name: name || undefined,
    template: currentMode === 'powershell' ? undefined : sourceTemplate,
    powershellTemplate: currentMode === 'powershell' ? sourceTemplate : undefined,
  };

  // 分步更新进度
  generatingStep.value = '正在分析模板...';

  const completed = await completeMetadataStream(commandForAI);

  if (completed) {
    generatingStep.value = '正在填充描述...';
    // 模拟短暂延迟让用户看到进度
    await new Promise(r => setTimeout(r, 200));

    // 合并补全的数据
    if (completed.description) {
      draftCommand.value.description = completed.description;
    }

    generatingStep.value = '正在填充分类...';
    await new Promise(r => setTimeout(r, 150));

    if (completed.category) {
      draftCommand.value.category = completed.category;
    }

    generatingStep.value = '正在填充标签...';
    await new Promise(r => setTimeout(r, 150));

    if (completed.tags && completed.tags.length > 0) {
      draftCommand.value.tags = completed.tags;
    }

    generatingStep.value = '正在填充使用说明...';
    await new Promise(r => setTimeout(r, 150));

    if (completed.usage) {
      draftCommand.value.usage = completed.usage;
    }

    generatingStep.value = '';
    showToast("AI 补全成功", "success");
  } else {
    generatingStep.value = '';
    showToast("AI 补全失败", "error");
  }
}

// 6. 提示消息
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

// 7. 命令操作
function handleImportCommand(command: CommandEntry) {
  const newCommand = { ...command, id: `cmd-${Date.now()}` };
  emit("import:command", newCommand);
  showToast("导入成功", "success");
}

function handleExportCommand() {
  if (!selected.value) return;
  const json = JSON.stringify(selected.value, null, 2);
  navigator.clipboard.writeText(json).then(() => {
    showToast("已复制 JSON 到剪贴板", "success");
  }).catch(() => {
    showToast("复制失败", "error");
  });
}

function handleCopy() {
  if (!canCopy.value) {
    showToast("请先修正参数或命令", "error");
    return;
  }
  showToast("已复制", "success");
}

function handleDeleteCommand() {
  if (!selected.value) return;
  emit("delete", selected.value.id);
  internalSelectedId.value = "";
  showToast("删除成功", "success");
}

function handleSaveCommandEdit() {
  doSaveCommandEdit((cmd) => emit("update:command", cmd), showToast);
}

function handleAddCategory(category: string) {
  emit("add-category", category);
  showToast("分类添加成功", "success");
}

function handleDeleteCategory(category: string, action: "move" | "clear", targetCategory?: string) {
  emit("delete-category", category, action, targetCategory);
  if (action === "move") {
    showToast(`已将命令移动到「${targetCategory}」`, "success");
  } else {
    showToast("分类已删除", "success");
  }
}

// 使用说明可折叠状态
const usageCollapsible = computed(() => {
  const bp = breakpoint.value;
  return bp === "M" || bp === "S" || bp === "XS" || heightLevel.value !== "H2";
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
              :scripts="scripts || []"
              :selected-id="selected?.id ?? null"
              :trashed-commands="trashedCommands"
              :mode="internalMode"
              :keyword="keyword"
              :selected-categories="selectedCategories"
              :selected-script-type="selectedScriptType"
              @update:keyword="keyword = $event"
              @update:selected-categories="selectedCategories = $event"
              @update:mode="internalMode = $event"
              @update:selectedScriptType="selectedScriptType = $event"
              @select="handleSelect"
              @create="$emit('create')"
              @restore-trash="$emit('restore-trash', $event)"
              @delete-permanently="$emit('delete-permanently', $event)"
              @empty-trash="$emit('empty-trash')"
              @import="handleImportCommand"
              @addCategory="handleAddCategory"
              @deleteCategory="handleDeleteCategory"
              @open-script-manage="$emit('open-script-manage')"
            />
          </aside>

          <!-- Main Content Area -->
          <main ref="mainEl" class="cs-main">
            <!-- 移动端顶部栏 -->
            <div v-if="isNarrow" class="cs-narrow-top">
              <button class="cs-btn cs-btn-outline cs-btn-sm" type="button" @click="navOpen = true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                {{ internalMode === 'command' ? '命令列表' : '脚本列表' }}
              </button>
              <div class="cs-narrow-title">{{ selected?.name ?? "请选择命令" }}</div>
            </div>

            <!-- 空状态 -->
            <div v-if="internalMode === 'command' && !selected" class="cs-empty">
              <div class="cs-empty-icon">⌘</div>
              <div class="cs-empty-text">请在左侧选择一条命令以开始配置</div>
            </div>

            <!-- 命令内容状态 -->
            <div v-else-if="internalMode === 'command'" class="cs-content">
              <div class="cs-view-panel">
                <!-- 1. 命令标题 -->
                <header v-if="selected || isCommandEditing" class="cs-view-section cs-header-section">
                  <template v-if="!isCommandEditing && selected">
                    <div class="cs-title-row">
                      <div class="cs-title-main">
                        <h1 class="cs-title">{{ selected.name }}</h1>
                      </div>
                      <CommandActionsFrom
                        :command="selected"
                        @export="handleExportCommand"
                        @edit="startCommandEdit"
                        @delete="handleDeleteCommand"
                      />
                    </div>
                    <p v-if="selected.description" class="cs-subtitle">{{ selected.description }}</p>
                    <div v-if="selected.tags?.length" class="cs-tags cs-tags-lg" style="margin-top: 16px;">
                      <span v-for="t in selected.tags" :key="t" class="cs-tag cs-tag-lg">{{ t }}</span>
                    </div>
                  </template>

                  <template v-else-if="draftCommand">
                    <CommandEditForm
                      :draft-command="draftCommand"
                      :categories="categories"
                      :template-edit-mode="templateEditMode"
                      :is-generating="isCompleting"
                      :generating-step="generatingStep"
                      @update:draft-command="draftCommand = $event"
                      @update:template-edit-mode="templateEditMode = $event"
                      @cancel="cancelCommandEdit"
                      @save="handleSaveCommandEdit"
                      @ai-complete="handleAICompleteCommand"
                    />
                  </template>
                </header>

                <!-- 2. 最终命令预览（核心区域） -->
                <section class="cs-view-section cs-preview-section">
                  <CommandPreview
                    :final-command="finalCommand"
                    :powershell-template="powershellTemplate"
                    :can-copy="canCopy"
                    :validation-ok="finalValidation.ok"
                    :validation-reasons="finalValidation.reasons"
                    @copy="handleCopy()"
                  />
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

            <!-- 脚本模式：显示脚本卡片网格 -->
            <div v-else class="cs-script-content">
              <div class="cs-script-grid">
                <ScriptCard
                  v-for="script in filteredScripts"
                  :key="script.id"
                  :script="script"
                  @edit="$emit('edit-script', $event)"
                />
              </div>
              <div v-if="filteredScripts.length === 0" class="cs-empty-state">
                <div class="cs-empty-icon">📄</div>
                <div class="cs-empty-text">没有找到脚本</div>
                <div class="cs-empty-hint">尝试切换过滤条件或搜索其他内容</div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
    <!-- 移动端抽屉 -->
    <div v-if="navOpen" class="cs-overlay" @click="navOpen = false">
      <div class="cs-drawer" @click.stop>
        <div class="cs-drawer-head">
          <button class="cs-btn cs-btn-outline cs-btn-sm" type="button" @click="navOpen = false">关闭</button>
        </div>
        <div class="cs-drawer-body">
          <CommandSidebar
            :categories="categories"
            :filtered-commands="filteredCommands"
            :scripts="scripts || []"
            :selected-id="selected?.id ?? null"
            :trashed-commands="trashedCommands"
            :mode="internalMode"
            :keyword="keyword"
            :selected-categories="selectedCategories"
            @update:keyword="keyword = $event"
            @update:selected-categories="selectedCategories = $event"
            @update:mode="internalMode = $event"
            @select="handleSelect"
            @create="$emit('create')"
            @import="$emit('import')"
            @export="$emit('export')"
            @import-command="handleImportCommand"
            @restore-trash="$emit('restore-trash', $event)"
            @delete-permanently="$emit('delete-permanently', $event)"
            @empty-trash="$emit('empty-trash')"
            @add-category="handleAddCategory"
            @delete-category="handleDeleteCategory"
            @edit-script="$emit('edit-script', $event)"
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

/* 脚本网格样式 */
.cs-script-content {
  display: flex;
  flex-direction: column;
  padding: 24px;
  height: 100%;
}

.cs-script-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  padding: 16px;
}

.cs-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  flex: 1;
}

.cs-empty-state .cs-empty-icon {
  font-size: 64px;
  margin-bottom: 24px;
  opacity: 0.5;
}

.cs-empty-state .cs-empty-text {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 12px;
  color: #141413;
}

.cs-empty-state .cs-empty-hint {
  font-size: 14px;
  color: #5e5d59;
}

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
