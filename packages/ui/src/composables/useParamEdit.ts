import { ref, computed, type Ref } from "vue";
import type { CommandEntry, EnumParamDefinition, ParamDefinition } from "@commandselector/shared";

/**
 * 参数编辑核心逻辑
 * - CRUD: 新增/删除/更新/排序参数
 * - 模板同步: 新增参数在光标位置插入 {{key}}，删除参数移除占位符，key 变更自动替换
 * - 光标追踪: 记录模板 textarea 光标位置，检测是否在 {{key}} 内
 * - 校验: 实时计算 paramErrors（键为空/重复、名称为空、枚举无选项）
 */
export function useParamEdit(
  draftCommand: Ref<CommandEntry>,
  templateEditMode: Ref<"cmd" | "powershell">
) {
  // 光标位置（模板 textarea 的 selectionStart）
  const cursorPos = ref(0);

  // 展开的参数卡片 key 集合
  const expandedKeys = ref<Set<string>>(new Set());

  // 从模板 {{key}} 点击高亮的参数 key
  const highlightedKey = ref("");

  // 高亮自动清除定时器
  let highlightTimer: ReturnType<typeof setTimeout> | null = null;

  // --- 实时校验 ---
  const paramErrors = computed<Record<string, string[]>>(() => {
    const errors: Record<string, string[]> = {};
    const keyCount = new Map<string, number>();

    for (const p of draftCommand.value.params) {
      const errs: string[] = [];

      if (!p.key.trim()) {
        errs.push("参数键不能为空");
      } else {
        const count = keyCount.get(p.key) || 0;
        keyCount.set(p.key, count + 1);
        if (count > 0) errs.push(`参数键重复: ${p.key}`);
      }

      if (!p.label.trim()) {
        errs.push("显示名称不能为空");
      }

      if (p.type === "enum") {
        const opts = (p as EnumParamDefinition).options;
        if (!opts || opts.length === 0) {
          errs.push("枚举类型至少需要一个选项");
        } else if (opts.some(o => !o.value.trim())) {
          errs.push("枚举选项值不能为空");
        }
      }

      if (errs.length) errors[p.key] = errs;
    }
    return errors;
  });

  const hasParamErrors = computed(() =>
    Object.values(paramErrors.value).some(errs => errs.length > 0)
  );

  // --- 参数 CRUD ---

  function addParam() {
    const params = draftCommand.value.params;
    const newKey = `param_${params.length + 1}`;
    const newParam: ParamDefinition = {
      key: newKey,
      label: "新参数",
      type: "text",
      required: false,
      defaultValue: "",
      hint: ""
    };

    params.push(newParam);

    // 在模板光标位置插入 {{key}}
    insertPlaceholderAtCursor(newKey);

    // 展开新参数卡片
    expandedKeys.value = new Set([...expandedKeys.value, newKey]);
  }

  function removeParam(key: string) {
    const params = draftCommand.value.params;
    const index = params.findIndex(p => p.key === key);
    if (index === -1) return;

    params.splice(index, 1);
    removePlaceholderFromTemplate(key);

    // 清理展开状态
    const next = new Set(expandedKeys.value);
    next.delete(key);
    expandedKeys.value = next;
  }

  function updateParam(index: number, field: string, value: unknown) {
    const params = draftCommand.value.params;
    if (index < 0 || index >= params.length) return;

    const param = params[index];

    // key 变更时同步模板
    if (field === "key" && value !== param.key) {
      const oldKey = param.key;
      param.key = String(value);
      if (oldKey.trim()) {
        replaceKeyInTemplate(oldKey, param.key);
      }
    } else if (field === "type") {
      param.type = value as ParamDefinition["type"];
      // 切换到 enum 时初始化 options
      if (param.type === "enum" && !(param as EnumParamDefinition).options) {
        (param as EnumParamDefinition).options = [];
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (param as any)[field] = value;
    }
  }

  function moveParam(index: number, direction: -1 | 1) {
    const params = draftCommand.value.params;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= params.length) return;
    [params[index], params[newIndex]] = [params[newIndex], params[index]];
  }

  // --- 模板-参数同步 ---

  function getActiveTemplate(): string {
    return templateEditMode.value === "powershell"
      ? (draftCommand.value.powershellTemplate ?? "")
      : draftCommand.value.template;
  }

  function setActiveTemplate(value: string) {
    if (templateEditMode.value === "powershell") {
      draftCommand.value.powershellTemplate = value;
    } else {
      draftCommand.value.template = value;
    }
  }

  function insertPlaceholderAtCursor(key: string) {
    const template = getActiveTemplate();
    const pos = cursorPos.value;

    if (pos > 0 && pos <= template.length) {
      const before = template.slice(0, pos);
      const after = template.slice(pos);
      const separator = before.length > 0 && !before.endsWith(" ") ? " " : "";
      setActiveTemplate((before + separator + `{{${key}}}` + after).trim());
    } else {
      // 追加到末尾
      const separator = template.length > 0 && !template.endsWith(" ") ? " " : "";
      setActiveTemplate((template + separator + `{{${key}}}`).trim());
    }
  }

  function removePlaceholderFromTemplate(key: string) {
    // 同时清理 CMD 和 PowerShell 模板
    const regex = new RegExp(`\\s*\\{\\{\\s*${escapeRegex(key)}\\s*\\}\\}\\s*`, "g");
    draftCommand.value.template = draftCommand.value.template.replace(regex, " ").replace(/\s+/g, " ").trim();
    if (draftCommand.value.powershellTemplate) {
      draftCommand.value.powershellTemplate = draftCommand.value.powershellTemplate
        .replace(regex, " ").replace(/\s+/g, " ").trim();
    }
  }

  function replaceKeyInTemplate(oldKey: string, newKey: string) {
    const regex = new RegExp(`\\{\\{\\s*${escapeRegex(oldKey)}\\s*\\}\\}`, "g");
    draftCommand.value.template = draftCommand.value.template.replace(regex, `{{${newKey}}}`);
    if (draftCommand.value.powershellTemplate) {
      draftCommand.value.powershellTemplate = draftCommand.value.powershellTemplate.replace(regex, `{{${newKey}}}`);
    }
  }

  // --- 光标追踪 ---

  function handleTemplateCursorClick(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    if (!textarea || typeof textarea.selectionStart !== "number") return;

    cursorPos.value = textarea.selectionStart;

    // 检测光标是否在 {{key}} 内
    const text = textarea.value;
    const pos = textarea.selectionStart;

    // 向左找 {{
    let left = pos;
    while (left > 0 && text.slice(left, left + 2) !== "{{") left--;
    if (text.slice(left, left + 2) !== "{{") return;

    // 向右找 }}
    let right = pos;
    while (right < text.length && text.slice(right, right + 2) !== "}}") right++;
    if (text.slice(right, right + 2) !== "}}") return;

    // 提取 key
    const inner = text.slice(left + 2, right).trim();
    if (/^[a-zA-Z0-9_\-]+$/.test(inner) && draftCommand.value.params.some(p => p.key === inner)) {
      setHighlightedKey(inner);
    }
  }

  function setHighlightedKey(key: string) {
    highlightedKey.value = key;
    if (highlightTimer) clearTimeout(highlightTimer);
    highlightTimer = setTimeout(() => {
      highlightedKey.value = "";
    }, 2000);

    // 确保卡片可见（展开）
    if (!expandedKeys.value.has(key)) {
      expandedKeys.value = new Set([...expandedKeys.value, key]);
    }
  }

  // --- 折叠控制 ---

  function toggleExpand(key: string) {
    const next = new Set(expandedKeys.value);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    expandedKeys.value = next;
  }

  function isExpanded(key: string): boolean {
    return expandedKeys.value.has(key);
  }

  // --- 工具函数 ---

  function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  return {
    cursorPos,
    expandedKeys,
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
  };
}
