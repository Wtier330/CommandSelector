import { ref, computed, watch, type Ref } from "vue";
import type { CommandEntry } from "@commandselector/shared";
import { useRustSearch } from "./useRustSearch";

export function useCommandFilter(commands: Ref<CommandEntry[]>) {
  const keyword = ref("");
  const selectedCategories = ref<string[]>(["__all__"]);
  const { searchCommands } = useRustSearch();

  const categories = computed(() => {
    const set = new Set<string>();
    for (const c of commands.value) {
      if (c.category) set.add(c.category);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
  });

  const rustSearchResult = ref<CommandEntry[]>([]);

  watch(
    [commands, keyword, selectedCategories],
    async () => {
      const k = keyword.value.trim();
      const isNone = selectedCategories.value.includes("__none__");

      // 无分类选项时返回空
      if (isNone) {
        rustSearchResult.value = [];
        return;
      }

      // 无关键词时返回全部
      if (!k) {
        rustSearchResult.value = commands.value;
        return;
      }

      // 有关键词时调用 Rust 搜索
      try {
        const result = await searchCommands(k, selectedCategories.value, commands.value);
        rustSearchResult.value = result.filtered;
      } catch (error) {
        console.error("Rust search failed, falling back to TypeScript:", error);
        rustSearchResult.value = fallbackFilter();
      }
    },
    { immediate: true }
  );

  // TypeScript 后备过滤函数
  function fallbackFilter(): CommandEntry[] {
    const k = keyword.value.trim().toLowerCase();
    const isAll = selectedCategories.value.includes("__all__");
    const isNone = selectedCategories.value.includes("__none__");

    if (isNone) return [];

    return commands.value.filter((c) => {
      if (!isAll) {
        if (!selectedCategories.value.includes(c.category ?? "")) return false;
      }
      if (!k) return true;
      const hay = [
        c.name,
        c.description ?? "",
        c.category ?? "",
        ...(c.tags ?? []),
        c.engine ?? "",
        c.platform ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(k);
    });
  }

  return {
    keyword,
    selectedCategories,
    categories,
    filteredCommands: rustSearchResult,
  };
}
