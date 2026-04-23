import { ref, computed, type Ref } from "vue";
import type { ScriptFileMeta } from "@commandselector/shared";
import { fuzzyMatch } from "@commandselector/ui";

/**
 * 脚本过滤管理
 * @param scripts - 脚本列表
 * @returns 过滤状态和方法
 */
export function useScriptFilters(scripts: Ref<ScriptFileMeta[]>) {
  const keyword = ref("");
  const selectedType = ref<"all" | "bat" | "ps1">("all");

  const filteredScripts = computed(() => {
    let result = scripts.value;

    if (selectedType.value !== "all") {
      result = result.filter((s) => s.type === selectedType.value);
    }

    if (keyword.value.trim()) {
      const kw = keyword.value.toLowerCase();
      result = result.filter((s) => {
        // 检查名称
        if (fuzzyMatch(s.name, kw).matched) return true;
        // 检查描述
        if (s.description && fuzzyMatch(s.description, kw).matched) return true;
        // 检查元数据简称
        if (s.metadata?.name && fuzzyMatch(s.metadata.name, kw).matched) return true;
        // 检查元数据描述
        if (s.metadata?.description && fuzzyMatch(s.metadata.description, kw).matched) return true;
        // 检查分类
        if (s.metadata?.category && fuzzyMatch(s.metadata.category, kw).matched) return true;
        // 检查标签
        if (s.metadata?.tags?.some(tag => fuzzyMatch(tag, kw).matched)) return true;
        return false;
      });
    }

    return result.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  });

  const stats = computed(() => {
    const batCount = scripts.value.filter((s) => s.type === "bat").length;
    const ps1Count = scripts.value.filter((s) => s.type === "ps1").length;
    return { batCount, ps1Count, total: scripts.value.length };
  });

  return {
    keyword,
    selectedType,
    filteredScripts,
    stats
  };
}
