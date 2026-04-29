<script setup lang="ts">
import type { ParamDefinition, EnumParamDefinition } from "@commandselector/shared";
import EnumOptionsEditor from "./EnumOptionsEditor.vue";

const props = defineProps<{
  param: ParamDefinition;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  expanded: boolean;
  errors: string[];
  highlighted: boolean;
}>();

const emit = defineEmits<{
  (e: "toggle-expand"): void;
  (e: "remove"): void;
  (e: "move", direction: -1 | 1): void;
  (e: "update", field: string, value: unknown): void;
}>();

function enumOptions(): Array<{ label: string; value: string }> {
  return props.param.type === "enum"
    ? (props.param as EnumParamDefinition).options ?? []
    : [];
}

function updateEnumOptions(options: Array<{ label: string; value: string }>) {
  (props.param as EnumParamDefinition).options = options;
}
</script>

<template>
  <div class="cs-param-card" :class="{ 'is-highlighted': highlighted }">
    <!-- 折叠态：一行核心字段 -->
    <div class="cs-param-card-header" @click="emit('toggle-expand')">
      <div class="cs-param-card-summary">
        <label class="cs-param-card-field cs-param-card-key">
          <input
            :value="param.key"
            class="cs-input cs-input-sm cs-input-mono"
            placeholder="参数键"
            @click.stop
            @input="emit('update', 'key', ($event.target as HTMLInputElement).value)"
          />
        </label>
        <label class="cs-param-card-field">
          <input
            :value="param.label"
            class="cs-input cs-input-sm"
            placeholder="显示名称"
            @click.stop
            @input="emit('update', 'label', ($event.target as HTMLInputElement).value)"
          />
        </label>
        <label class="cs-param-card-field cs-param-card-type">
          <select
            :value="param.type"
            class="cs-input cs-input-sm"
            @click.stop
            @change="emit('update', 'type', ($event.target as HTMLSelectElement).value)"
          >
            <option value="text">文本</option>
            <option value="number">数字</option>
            <option value="path">路径</option>
            <option value="enum">枚举</option>
            <option value="boolean">布尔</option>
          </select>
        </label>
      </div>
      <div class="cs-param-card-actions">
        <button
          class="cs-btn-icon cs-btn-icon-sm"
          type="button"
          title="上移"
          :disabled="isFirst"
          @click.stop="emit('move', -1)"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"></polyline></svg>
        </button>
        <button
          class="cs-btn-icon cs-btn-icon-sm"
          type="button"
          title="下移"
          :disabled="isLast"
          @click.stop="emit('move', 1)"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
        <button
          class="cs-btn-icon cs-btn-icon-sm cs-btn-delete-entry"
          type="button"
          title="删除参数"
          @click.stop="emit('remove')"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
        <svg
          class="cs-param-card-chevron"
          viewBox="0 0 24 24" width="14" height="14"
          fill="none" stroke="currentColor" stroke-width="2"
          :style="{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }"
        >
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </div>
    </div>

    <!-- 内联错误（折叠态也可见） -->
    <div v-if="errors.length" class="cs-param-card-errors">
      <span v-for="err in errors" :key="err" class="cs-field-error">{{ err }}</span>
    </div>

    <!-- 展开态：高级字段 -->
    <Transition name="cs-collapse">
      <div v-if="expanded" class="cs-param-card-body">
        <div class="cs-param-card-advanced">
          <label class="cs-param-card-field">
            <span class="cs-param-card-field-label">默认值</span>
            <input
              v-if="param.type !== 'boolean'"
              :value="param.defaultValue"
              class="cs-input cs-input-sm"
              placeholder="选填"
              @input="emit('update', 'defaultValue', ($event.target as HTMLInputElement).value)"
            />
            <label v-else class="cs-check" style="margin-top: 4px;">
              <input
                type="checkbox"
                :checked="Boolean(param.defaultValue)"
                @change="emit('update', 'defaultValue', ($event.target as HTMLInputElement).checked)"
              />
              <span>启用</span>
            </label>
          </label>
          <label class="cs-param-card-field cs-param-card-required">
            <span class="cs-param-card-field-label">必填</span>
            <label class="cs-check" style="margin-top: 4px;">
              <input
                type="checkbox"
                :checked="param.required"
                @change="emit('update', 'required', ($event.target as HTMLInputElement).checked)"
              />
            </label>
          </label>
          <label class="cs-param-card-field" style="flex: 1;">
            <span class="cs-param-card-field-label">提示说明</span>
            <input
              :value="param.hint"
              class="cs-input cs-input-sm"
              placeholder="选填"
              @input="emit('update', 'hint', ($event.target as HTMLInputElement).value)"
            />
          </label>
        </div>
        <EnumOptionsEditor
          v-if="param.type === 'enum'"
          :options="enumOptions()"
          @update:options="updateEnumOptions"
        />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.cs-param-card {
  background: var(--cs-card, #faf9f5);
  border: 1px solid var(--cs-border, #e5e7eb);
  border-radius: 8px;
  padding: 8px 12px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.cs-param-card.is-highlighted {
  animation: cs-highlight-pulse 2s ease-out;
}

@keyframes cs-highlight-pulse {
  0% { border-color: var(--cs-blue-200, #bfdbfe); box-shadow: 0 0 0 3px rgba(56, 152, 236, 0.2); }
  100% { border-color: var(--cs-border, #e5e7eb); box-shadow: none; }
}

.cs-param-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  cursor: pointer;
}

.cs-param-card-summary {
  display: flex;
  gap: 8px;
  flex: 1;
  align-items: center;
}

.cs-param-card-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.cs-param-card-key {
  max-width: 140px;
}

.cs-param-card-type {
  max-width: 100px;
}

.cs-param-card-field-label {
  font-size: 11px;
  color: var(--cs-muted, #6b7280);
}

.cs-input-mono {
  font-family: ui-monospace, Consolas, "Courier New", monospace;
  font-size: 12px;
}

.cs-param-card-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.cs-param-card-chevron {
  margin-left: 2px;
  color: var(--cs-muted, #6b7280);
  flex-shrink: 0;
}

.cs-param-card-errors {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 0 0;
}

.cs-param-card-body {
  padding-top: 10px;
}

.cs-param-card-advanced {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.cs-param-card-required {
  max-width: 60px;
}

.cs-check {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--cs-text, #0f172a);
  user-select: none;
}

/* 折叠动画 */
.cs-collapse-enter-active,
.cs-collapse-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.cs-collapse-enter-from,
.cs-collapse-leave-to {
  opacity: 0;
  max-height: 0;
}

.cs-collapse-enter-to,
.cs-collapse-leave-from {
  opacity: 1;
  max-height: 400px;
}
</style>
