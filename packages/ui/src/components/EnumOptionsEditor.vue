<script setup lang="ts">
const props = defineProps<{
  options: Array<{ label: string; value: string }>;
}>();

const emit = defineEmits<{
  (e: "update:options", value: Array<{ label: string; value: string }>): void;
}>();

function updateOption(index: number, field: "label" | "value", val: string) {
  const next = [...props.options];
  next[index] = { ...next[index], [field]: val };
  emit("update:options", next);
}

function removeOption(index: number) {
  const next = [...props.options];
  next.splice(index, 1);
  emit("update:options", next);
}

function addOption() {
  emit("update:options", [...props.options, { label: "", value: "" }]);
}
</script>

<template>
  <div class="cs-enum-editor">
    <span class="cs-enum-editor-label">枚举选项</span>
    <div class="cs-enum-option-list">
      <div v-for="(opt, i) in options" :key="i" class="cs-enum-option-row">
        <label class="cs-enum-field">
          <span class="cs-enum-field-label">显示文本</span>
          <input
            :value="opt.label"
            class="cs-input cs-input-sm"
            placeholder="如：启用"
            @input="updateOption(i, 'label', ($event.target as HTMLInputElement).value)"
          />
        </label>
        <label class="cs-enum-field">
          <span class="cs-enum-field-label">实际值</span>
          <input
            :value="opt.value"
            class="cs-input cs-input-sm"
            placeholder="如：enabled"
            @input="updateOption(i, 'value', ($event.target as HTMLInputElement).value)"
          />
        </label>
        <button
          class="cs-btn-icon cs-btn-icon-sm cs-btn-delete-entry"
          type="button"
          title="删除选项"
          style="margin-top: 18px;"
          @click="removeOption(i)"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
    <button class="cs-btn cs-btn-outline cs-btn-sm" type="button" @click="addOption">
      + 添加选项
    </button>
  </div>
</template>

<style scoped>
.cs-enum-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--cs-border, #e5e7eb);
}

.cs-enum-editor-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--cs-muted-2, #9ca3af);
}

.cs-enum-option-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cs-enum-option-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.cs-enum-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.cs-enum-field-label {
  font-size: 11px;
  color: var(--cs-muted, #6b7280);
}
</style>
