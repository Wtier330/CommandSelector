<script setup lang="ts">
import { ref, computed, toRef } from "vue";
import type { CommandEntry } from "@commandselector/shared";
import CategorySelect from "./CategorySelect.vue";
import ParamEditCard from "./ParamEditCard.vue";
import { useParamEdit } from "../composables/useParamEdit";

const props = defineProps<{
  draftCommand: CommandEntry;
  categories: string[];
  templateEditMode: "cmd" | "powershell";
  isGenerating?: boolean;
  generatingStep?: string;
}>();

const emit = defineEmits<{
  (e: "update:draftCommand", value: CommandEntry): void;
  (e: "update:templateEditMode", value: "cmd" | "powershell"): void;
  (e: "cancel"): void;
  (e: "save"): void;
  (e: "ai-complete"): void;
}>();

const showMoreOptions = ref(false);

// 参数编辑 composable
const {
  highlightedKey,
  paramErrors,
  hasParamErrors,
  addParam,
  removeParam,
  updateParam,
  moveParam,
  toggleExpand,
  isExpanded,
  handleTemplateCursorClick,
} = useParamEdit(toRef(props, "draftCommand"), toRef(props, "templateEditMode"));

// 命令名称实时校验
const nameError = computed(() => {
  if (!props.draftCommand.name?.trim()) return "命令名称不能为空";
  return "";
});

// 模板实时校验
const templateError = computed(() => {
  const tpl = props.templateEditMode === "powershell"
    ? props.draftCommand.powershellTemplate
    : props.draftCommand.template;
  if (!tpl?.trim()) return "命令模板不能为空";
  return "";
});

// 保存前校验
function handleSave() {
  if (nameError.value || templateError.value || hasParamErrors.value) return;
  emit("save");
}

// 模板输入
function handleTemplateInput(event: Event) {
  const value = (event.target as HTMLTextAreaElement).value;
  const field = props.templateEditMode === "powershell" ? "powershellTemplate" : "template";
  emit("update:draftCommand", { ...props.draftCommand, [field]: value });
}
</script>

<template>
  <div class="cs-command-edit">
    <!-- 顶部操作栏 -->
    <div class="cs-command-edit-header">
      <div class="cs-command-edit-title-row">
        <button class="cs-btn cs-btn-outline cs-btn-sm" @click="emit('cancel')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          取消
        </button>
        <button
          class="cs-btn cs-btn-ai"
          :class="{ 'cs-btn-loading': isGenerating }"
          :disabled="isGenerating"
          @click="emit('ai-complete')"
        >
          <span v-if="isGenerating" class="cs-btn-ai-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" stroke-dasharray="31.4" stroke-dashoffset="10"/>
            </svg>
          </span>
          <span v-if="isGenerating && generatingStep" class="cs-btn-ai-step">{{ generatingStep }}</span>
          <span v-else>{{ isGenerating ? '补全中...' : 'AI 补全' }}</span>
        </button>
      </div>
      <button class="cs-btn cs-btn-primary" @click="handleSave">完成</button>
    </div>

    <!-- 核心信息：命令名称 + 模板类型 -->
    <div class="cs-command-edit-grid">
      <label class="cs-field-col">
        <span class="cs-field-label">命令名称 <span style="color:#ef4444">*</span></span>
        <input
          :value="draftCommand.name"
          @input="emit('update:draftCommand', { ...draftCommand, name: ($event.target as HTMLInputElement).value })"
          class="cs-input cs-input-sm"
          :class="{ 'cs-input-error': nameError }"
          placeholder="必填"
        />
        <div v-if="nameError" class="cs-field-error">{{ nameError }}</div>
      </label>

      <label class="cs-field-col">
        <span class="cs-field-label">模板类型</span>
        <select
          :value="templateEditMode"
          @change="emit('update:templateEditMode', ($event.target as HTMLSelectElement).value as 'cmd' | 'powershell')"
          class="cs-input cs-input-sm"
        >
          <option value="cmd">仅 CMD 模板</option>
          <option value="powershell">仅 PowerShell 模板</option>
        </select>
      </label>

      <label class="cs-field-col">
        <span class="cs-field-label">描述</span>
        <input
          :value="draftCommand.description"
          @input="emit('update:draftCommand', { ...draftCommand, description: ($event.target as HTMLInputElement).value })"
          class="cs-input cs-input-sm"
          placeholder="一句话描述用途"
        />
      </label>

      <label class="cs-field-col">
        <span class="cs-field-label">分类</span>
        <CategorySelect
          :categories="categories"
          :model-value="draftCommand.category"
          @update:model-value="emit('update:draftCommand', { ...draftCommand, category: $event })"
        />
      </label>
    </div>

    <!-- 模板编辑 -->
    <div class="cs-command-edit-template">
      <h3 class="cs-command-edit-section-title">
        {{ templateEditMode === 'cmd' ? 'CMD 模板' : 'PowerShell 模板' }}
        <span style="color:#ef4444">*</span>
      </h3>
      <textarea
        :value="draftCommand[templateEditMode === 'powershell' ? 'powershellTemplate' : 'template']"
        @input="handleTemplateInput"
        @click="handleTemplateCursorClick"
        @keyup="handleTemplateCursorClick"
        class="cs-input cs-textarea"
        :class="{ 'cs-input-error': templateError }"
        rows="4"
        :placeholder="templateEditMode === 'powershell' ? '使用 {{参数名}} 作为占位符，如：Test-Path {{path}}' : '使用 {{参数名}} 作为占位符，如：ping {{target}} -n {{count}}'"
      ></textarea>
      <div v-if="templateError" class="cs-field-error">{{ templateError }}</div>
    </div>

    <!-- 参数配置 -->
    <div class="cs-command-edit-params">
      <div class="cs-params-section-header">
        <h3 class="cs-command-edit-section-title">参数配置</h3>
        <button class="cs-btn cs-btn-outline cs-btn-sm" type="button" @click="addParam">
          + 新增参数
        </button>
      </div>
      <p class="cs-params-hint">新增参数会在模板光标位置插入 &#123;&#123;参数名&#125;&#125; 占位符</p>

      <div v-if="draftCommand.params.length === 0" class="cs-params-empty">
        暂无参数，可点击上方按钮新增，或在模板中使用 &#123;&#123;参数名&#125;&#125; 语法
      </div>

      <div v-else class="cs-param-edit-list">
        <ParamEditCard
          v-for="(p, i) in draftCommand.params"
          :key="p.key + '-' + i"
          :param="p"
          :index="i"
          :is-first="i === 0"
          :is-last="i === draftCommand.params.length - 1"
          :expanded="isExpanded(p.key)"
          :errors="paramErrors[p.key] || []"
          :highlighted="highlightedKey === p.key"
          @toggle-expand="toggleExpand(p.key)"
          @remove="removeParam(p.key)"
          @move="moveParam(i, $event)"
          @update="(field, value) => updateParam(i, field, value)"
        />
      </div>
    </div>

    <!-- 更多选项（折叠） -->
    <div class="cs-command-edit-more">
      <button class="cs-more-toggle" @click="showMoreOptions = !showMoreOptions">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :style="{ transform: showMoreOptions ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
        更多选项
      </button>

      <Transition name="cs-collapse">
        <div v-if="showMoreOptions" class="cs-more-content">
          <label class="cs-field-col">
            <span class="cs-field-label">适用平台</span>
            <select
              :value="draftCommand.platform"
              @change="emit('update:draftCommand', { ...draftCommand, platform: ($event.target as HTMLSelectElement).value as 'windows' | 'macos' | 'linux' | 'any' })"
              class="cs-input cs-input-sm"
            >
              <option value="windows">Windows</option>
              <option value="macos">macOS</option>
              <option value="linux">Linux</option>
              <option value="any">不限</option>
            </select>
          </label>

          <div class="cs-field-col">
            <span class="cs-field-label">使用说明</span>
            <textarea
              :value="draftCommand.usage"
              @input="emit('update:draftCommand', { ...draftCommand, usage: ($event.target as HTMLTextAreaElement).value })"
              class="cs-input cs-textarea"
              rows="3"
              placeholder="补充说明或注意事项"
            ></textarea>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.cs-command-edit {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 顶部操作栏 */
.cs-command-edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cs-command-edit-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 信息网格 */
.cs-command-edit-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

/* 模板编辑 */
.cs-command-edit-template {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cs-command-edit-section-title {
  font-size: 13px;
  font-weight: 600;
  margin: 0;
  color: #374151;
}

/* 参数配置 */
.cs-params-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cs-params-hint {
  font-size: 12px;
  color: #9ca3af;
  margin: 0;
}

.cs-params-empty {
  font-size: 13px;
  color: #9ca3af;
  padding: 12px 0;
}

.cs-param-edit-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 输入框错误态 */
.cs-input-error {
  border-color: #fca5a5 !important;
}

.cs-input-error:focus {
  border-color: #ef4444 !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
}

/* 更多选项折叠 */
.cs-command-edit-more {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cs-more-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  color: #6b7280;
  padding: 4px 0;
  transition: color 0.2s;
}

.cs-more-toggle:hover {
  color: #374151;
}

.cs-more-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 4px;
}
</style>
