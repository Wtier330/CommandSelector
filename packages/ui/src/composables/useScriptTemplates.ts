import { ref, type Ref } from "vue";
import { getBatCommentTemplate, getPs1CommentTemplate } from "../utils/commentTemplates";

/**
 * 脚本模板管理
 * @param scriptContent - 脚本内容的响应式引用
 * @param scriptType - 脚本类型 (bat | ps1)
 * @returns 模板插入相关方法
 */
export function useScriptTemplates(
  scriptContent: Ref<string>,
  scriptType: Ref<"bat" | "ps1">
) {
  const hasChanges = ref(false);

  /**
   * 插入注释模板到文件开头
   */
  function insertCommentTemplate() {
    const template = scriptType.value === "bat"
      ? getBatCommentTemplate()
      : getPs1CommentTemplate();

    // 在文件开头插入
    const content = scriptContent.value;
    const newContent = template + "\n\n" + content;

    scriptContent.value = newContent;
    hasChanges.value = true;
  }

  /**
   * 获取当前脚本类型的模板
   */
  function getTemplate() {
    return scriptType.value === "bat"
      ? getBatCommentTemplate()
      : getPs1CommentTemplate();
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
