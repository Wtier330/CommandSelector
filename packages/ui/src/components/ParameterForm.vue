<script setup lang="ts">
import type { EnumParamDefinition, ParamDefinition } from "@commandselector/shared";

defineProps<{
  paramDefs: ParamDefinition[];
  paramValues: Record<string, string | boolean>;
  paramErrors: Record<string, string>;
}>();

const emit = defineEmits<{
  (e: "update:paramValue", key: string, value: string | boolean): void;
}>();

function enumOptions(def: ParamDefinition) {
  return def.type === "enum" ? (def as EnumParamDefinition).options : [];
}

function updateValue(key: string, value: string | boolean) {
  emit("update:paramValue", key, value);
}
</script>

<template>
  <div class="cs-params-wrap">
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
</template>

<style scoped>
@import "../styles/command-detail.css";
</style>
