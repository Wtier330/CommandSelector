import { ref, computed, watch, type Ref } from "vue";
import type { CommandEntry } from "@commandselector/shared";

/**
 * 命令编辑管理
 * @param selected - 当前选中的命令
 * @returns 编辑状态和方法
 */
export function useCommandEdit(selected: Ref<CommandEntry | null>) {
  const isCommandEditing = ref(false);
  const draftCommand = ref<CommandEntry | null>(null);
  const templateEditMode = ref<"cmd" | "powershell">("cmd");

  // 开始编辑
  function startCommandEdit() {
    if (!selected.value) return;
    draftCommand.value = JSON.parse(JSON.stringify(selected.value));
    templateEditMode.value = "cmd";
    isCommandEditing.value = true;
  }

  // 取消编辑
  function cancelCommandEdit() {
    isCommandEditing.value = false;
    draftCommand.value = null;
  }

  // 保存编辑
  function saveCommandEdit(onUpdate: (command: CommandEntry) => void, showToast: (msg: string, type: "success" | "error") => void) {
    if (!draftCommand.value) return;
    if (!draftCommand.value.name.trim()) {
      showToast("命令名称不能为空", "error");
      return;
    }
    if (!draftCommand.value.template.trim()) {
      showToast("命令模板不能为空", "error");
      return;
    }
    onUpdate(draftCommand.value);
    isCommandEditing.value = false;
    showToast("保存成功", "success");
  }

  // 切换模板编辑模式
  function handleEngineChange() {
    // templateEditMode 切换即可
  }

  // 标签字符串计算属性
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

  // 当选中命令变化时退出编辑模式
  watch(
    () => selected.value?.id,
    () => {
      isCommandEditing.value = false;
    }
  );

  return {
    isCommandEditing,
    draftCommand,
    templateEditMode,
    draftTagsStr,
    startCommandEdit,
    cancelCommandEdit,
    saveCommandEdit,
    handleEngineChange
  };
}
