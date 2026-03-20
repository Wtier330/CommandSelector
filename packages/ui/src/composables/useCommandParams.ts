import { computed, ref, watch, type Ref } from "vue";
import type { CommandEntry, ParamDefinition } from "@commandselector/shared";
import { validateCommandText } from "@commandselector/shared";
import { applyTemplate, extractPlaceholders } from "../utils/templateEngine";

export function useCommandParams(selectedCommand: Ref<CommandEntry | null>) {
  const paramValues = ref<Record<string, string | boolean>>({});

  const paramDefs = computed<ParamDefinition[]>(() => {
    const defs = selectedCommand.value?.params ?? [];
    if (defs.length) return defs;
    const keys = extractPlaceholders(selectedCommand.value?.template ?? "");
    return keys.map((k: string) => ({ key: k, label: k, type: "text" as const }));
  });

  function initParamValues(defs: ParamDefinition[]) {
    const next: Record<string, string | boolean> = {};
    for (const d of defs) {
      const existing = paramValues.value[d.key];
      if (existing !== undefined) {
        next[d.key] = existing;
        continue;
      }
      const dv = d.defaultValue;
      if (d.type === "boolean") {
        next[d.key] = typeof dv === "boolean" ? dv : false;
      } else {
        next[d.key] = dv === undefined || dv === null ? "" : String(dv);
      }
    }
    paramValues.value = next;
  }

  watch(
    () => selectedCommand.value?.id,
    () => {
      initParamValues(paramDefs.value);
    },
    { immediate: true, flush: 'sync' }
  );

  const finalCommand = computed(() => {
    const tpl = selectedCommand.value?.template ?? "";
    return applyTemplate(tpl, paramValues.value);
  });

  function validateParam(def: ParamDefinition, value: string | boolean) {
    if (def.required) {
      if (def.type === "boolean") {
        if (value !== true) return "该参数为必选";
      } else {
        if (String(value).trim() === "") return "该参数为必填";
      }
    }
    if (def.type === "number") {
      const s = String(value).trim();
      if (s !== "" && !Number.isFinite(Number(s))) return "请输入数字";
    }
    const v = String(value);
    const validation = def.validation;
    if (!validation) return null;
    if (validation.kind === "suffix") {
      const ok = validation.allowed.some((s) => v.toLowerCase().endsWith(s.toLowerCase()));
      return ok ? null : `后缀仅允许：${validation.allowed.join(", ")}`;
    }
    if (validation.kind === "regex") {
      try {
        const re = new RegExp(validation.pattern, validation.flags);
        return re.test(v) ? null : "格式不正确";
      } catch {
        return null;
      }
    }
    return null;
  }

  const paramErrors = computed(() => {
    const errors: Record<string, string> = {};
    for (const d of paramDefs.value) {
      const val = paramValues.value[d.key];
      const err = validateParam(d, val);
      if (err) errors[d.key] = err;
    }
    return errors;
  });

  const hasParamErrors = computed(() => Object.keys(paramErrors.value).length > 0);
  const finalValidation = computed(() => validateCommandText(finalCommand.value));
  const canCopy = computed(() => !!selectedCommand.value && finalValidation.value.ok && !hasParamErrors.value);

  return {
    paramDefs,
    paramValues,
    paramErrors,
    hasParamErrors,
    finalCommand,
    finalValidation,
    canCopy,
  };
}
