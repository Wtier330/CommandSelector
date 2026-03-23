<script setup lang="ts">
import { ref, watch } from "vue";
import type { CommandEntry, EnumParamDefinition, ParamDefinition } from "@commandselector/shared";

const props = defineProps<{
  command: CommandEntry;
  paramDefs: ParamDefinition[];
  paramValues: Record<string, string | boolean>;
  paramErrors: Record<string, string>;
}>();

const emit = defineEmits<{
  (e: "update:paramValue", key: string, value: string | boolean): void;
  (e: "update:command", command: CommandEntry): void;
}>();

function enumOptions(def: ParamDefinition) {
  return def.type === "enum" ? (def as EnumParamDefinition).options : [];
}

function updateValue(key: string, value: string | boolean) {
  emit("update:paramValue", key, value);
}

const isEditing = ref(false);
const draftParams = ref<ParamDefinition[]>([]);
let originalKeys = new Set<string>();

watch(() => props.command.id, () => {
  isEditing.value = false;
});

function startEdit() {
  draftParams.value = JSON.parse(JSON.stringify(props.paramDefs));
  originalKeys = new Set(draftParams.value.map(p => p.key));
  isEditing.value = true;
}

function cancelEdit() {
  isEditing.value = false;
}

function addParam() {
  const newKey = `param_${draftParams.value.length + 1}`;
  draftParams.value.push({
    key: newKey,
    label: "新参数",
    type: "text",
    required: false,
    defaultValue: "",
    hint: ""
  });
}

function removeParam(index: number) {
  draftParams.value.splice(index, 1);
}

function saveEdit() {
  // basic validation
  const keys = new Set();
  for (const p of draftParams.value) {
    if (!p.key.trim() || !p.label.trim()) {
      alert("参数键和显示名称不能为空");
      return;
    }
    if (keys.has(p.key)) {
      alert(`参数键不能重复: ${p.key}`);
      return;
    }
    keys.add(p.key);
  }

  // Handle template updates
  let newTemplate = props.command.template;
  
  // 1. If a parameter was removed, maybe we should remove its placeholder?
  // Actually, we can just leave it or do a simple replace
  for (const key of originalKeys) {
    if (!keys.has(key)) {
      // It was removed. We try to clean it up roughly, but might leave empty spaces.
      // Better to just let user fix it if needed, or remove {{key}}
      newTemplate = newTemplate.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), '');
    }
  }

  // 2. If a parameter was added, we append it to the template
  for (const p of draftParams.value) {
    if (!originalKeys.has(p.key)) {
      newTemplate += ` {{${p.key}}}`;
    }
  }

  const updatedCommand: CommandEntry = {
    ...props.command,
    params: JSON.parse(JSON.stringify(draftParams.value)),
    template: newTemplate.trim()
  };

  emit("update:command", updatedCommand);
  isEditing.value = false;
}
</script>

<template>
  <div class="cs-params-section-inner">
    <div class="cs-params-header-row">
      <h2 class="cs-section-title-text cs-params-header">参数配置</h2>
      <button v-if="!isEditing" class="cs-btn-icon cs-btn-edit-entry" @click="startEdit" title="编辑参数">
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="css-i6dzq1"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
        <span>配置</span>
      </button>
      <div v-else class="cs-actions" style="display: flex; gap: 12px;">
        <button class="cs-btn cs-btn-outline" @click="cancelEdit">取消</button>
        <button class="cs-btn cs-btn-primary" @click="saveEdit">完成</button>
      </div>
    </div>

    <div v-if="!isEditing">
      <div v-if="paramDefs.length === 0" class="cs-empty-text" style="font-size: 13px; color: #888; margin-top: 12px;">
        当前命令没有参数，您可以点击“编辑参数”添加。
      </div>
      <div v-else class="cs-params-wrap">
        <div class="cs-form">
          <div v-for="d in paramDefs" :key="d.key" class="cs-field">
            <div class="cs-field-head">
              <label class="cs-label">{{ d.label }}</label>
              <div v-if="paramErrors[d.key]" class="cs-field-error">{{ paramErrors[d.key] }}</div>
            </div>

            <input
              v-if="d.type === 'text' || d.type === 'path'"
              class="cs-input cs-input-param"
              :placeholder="d.hint || ''"
              :value="String(paramValues[d.key] ?? '')"
              @input="updateValue(d.key, ($event.target as HTMLInputElement).value)"
            />

            <input
              v-else-if="d.type === 'number'"
              class="cs-input cs-input-param"
              inputmode="numeric"
              :placeholder="d.hint || ''"
              :value="String(paramValues[d.key] ?? '')"
              @input="updateValue(d.key, ($event.target as HTMLInputElement).value)"
            />

            <select
              v-else-if="d.type === 'enum'"
              class="cs-input cs-input-param"
              :value="String(paramValues[d.key] ?? '')"
              @change="updateValue(d.key, ($event.target as HTMLSelectElement).value)"
            >
              <option v-for="op in enumOptions(d)" :key="op.value" :value="op.value">
                {{ op.label }}
              </option>
            </select>

            <label v-else-if="d.type === 'boolean'" class="cs-check">
              <input
                type="checkbox"
                :checked="Boolean(paramValues[d.key])"
                @change="updateValue(d.key, ($event.target as HTMLInputElement).checked)"
              />
              <span>{{ d.hint || "启用" }}</span>
            </label>

            <div v-if="d.hint && d.type !== 'boolean'" class="cs-help">{{ d.hint }}</div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="cs-params-edit-wrap">
      <div class="cs-edit-actions" style="margin: 0 0 20px 0; display: flex; align-items: center;">
        <button class="cs-btn cs-btn-outline" @click="addParam">新增参数</button>
        <span class="cs-help" style="margin-left: 16px;">新增参数会自动插入模板末尾，删除参数会自动从模板移除占位符</span>
      </div>
      
      <div class="cs-param-edit-list">
        <div v-for="(p, i) in draftParams" :key="i" class="cs-param-edit-card">
          <div class="cs-param-edit-row">
            <label class="cs-param-edit-field">
              <span>参数键 (Key)</span>
              <input v-model="p.key" class="cs-input cs-input-sm" placeholder="必填" />
            </label>
            <label class="cs-param-edit-field">
              <span>显示名称</span>
              <input v-model="p.label" class="cs-input cs-input-sm" placeholder="必填" />
            </label>
            <label class="cs-param-edit-field">
              <span>类型</span>
              <select v-model="p.type" class="cs-input cs-input-sm">
                <option value="text">文本 (Text)</option>
                <option value="number">数字 (Number)</option>
                <option value="path">路径 (Path)</option>
                <option value="enum">枚举 (Enum)</option>
                <option value="boolean">布尔 (Boolean)</option>
              </select>
            </label>
            <button class="cs-btn cs-btn-outline cs-btn-danger-text" style="margin-top: 25px;" @click="removeParam(i)">删除</button>
          </div>
          <div class="cs-param-edit-row" style="margin-top: 16px;">
            <label class="cs-param-edit-field">
              <span>默认值</span>
              <input v-if="p.type !== 'boolean'" v-model="p.defaultValue" class="cs-input cs-input-sm" placeholder="选填" />
              <label v-else class="cs-check" style="margin-top: 6px;">
                <input type="checkbox" v-model="p.defaultValue" />
                <span>启用</span>
              </label>
            </label>
            <label class="cs-param-edit-field" style="max-width: 60px;">
              <span>必填</span>
              <label class="cs-check" style="margin-top: 6px;">
                <input type="checkbox" v-model="p.required" />
              </label>
            </label>
            <label class="cs-param-edit-field" style="flex: 1;">
              <span>提示说明</span>
              <input v-model="p.hint" class="cs-input cs-input-sm" placeholder="选填" />
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import "../styles/command-detail.css";

.cs-params-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.cs-params-header {
  margin-bottom: 0 !important;
}

.cs-param-edit-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cs-param-edit-card {
  background: var(--cs-card);
  border: 1px solid var(--cs-border);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}

.cs-param-edit-row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.cs-param-edit-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: var(--cs-muted-2);
}

.cs-param-edit-field span {
  font-weight: 500;
}

.cs-input-sm {
  height: 32px;
  padding: 0 12px;
  font-size: 13px;
  border-radius: 6px;
  border: 1px solid var(--cs-border);
  background: #f8fafc;
}
.cs-input-sm:focus {
  background: #fff;
  border-color: var(--cs-blue-200);
  outline: none;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}
</style>
