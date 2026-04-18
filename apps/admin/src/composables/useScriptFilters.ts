import { ref, computed, type Ref } from "vue";
import type { ScriptFileMeta } from "@commandselector/shared";

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
      result = result.filter((s) =>
        s.name.toLowerCase().includes(kw) ||
        (s.description?.toLowerCase().includes(kw) ?? false)
      );
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
