import { ref, type Ref } from "vue";
import {
  getBatCommentTemplate,
  getPs1CommentTemplate,
  getVbsCommentTemplate,
  getShellCommentTemplate,
  getPythonCommentTemplate
} from "../utils/commentTemplates";
import type { ScriptType } from "@commandselector/shared";

/**
 * 脚本模板管理
 * @param scriptContent - 脚本内容的响应式引用
 * @param scriptType - 脚本类型
 * @returns 模板插入相关方法
 */
export function useScriptTemplates(
  scriptContent: Ref<string>,
  scriptType: Ref<ScriptType>
) {
  const hasChanges = ref(false);

  /**
   * 插入注释模板到文件开头
   */
  function insertCommentTemplate() {
    const template = getTemplateByType(scriptType.value);

    // 在文件开头插入
    const content = scriptContent.value;
    const newContent = template + "\n\n" + content;

    scriptContent.value = newContent;
    hasChanges.value = true;
  }

  /**
   * 根据脚本类型获取对应的模板
   */
  function getTemplateByType(type: ScriptType): string {
    switch (type) {
      case "bat":
      case "cmd":
        return getBatCommentTemplate();
      case "ps1":
        return getPs1CommentTemplate();
      case "vbs":
        return getVbsCommentTemplate();
      case "sh":
        return getShellCommentTemplate();
      case "py":
        return getPythonCommentTemplate();
      default:
        return getBatCommentTemplate();
    }
  }

  /**
   * 获取当前脚本类型的模板
   */
  function getTemplate() {
    return getTemplateByType(scriptType.value);
  }

  /**
   * 设置更改状态
   */
  function setChanged(changed: boolean) {
    hasChanges.value = changed;
  }

  return {
    hasChanges,
    insertCommentTemplate,
    getTemplate,
    setChanged
  };
}
