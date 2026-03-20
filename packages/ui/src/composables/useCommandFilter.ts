import { computed, ref, type Ref } from "vue";
import type { CommandEntry } from "@commandselector/shared";

export function useCommandFilter(commands: Ref<CommandEntry[]>) {
  const keyword = ref("");
  const selectedCategories = ref<string[]>(["__all__"]);

  const categories = computed(() => {
    const set = new Set<string>();
    for (const c of commands.value) {
      if (c.category) set.add(c.category);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
  });

  const filteredCommands = computed(() => {
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
  });

  return {
    keyword,
    selectedCategories,
    categories,
    filteredCommands,
  };
}
