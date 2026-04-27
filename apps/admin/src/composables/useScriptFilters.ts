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
  const selectedType = ref<string>("all");
  const selectedSource = ref<string>("all"); // "all" 表示所有来源

  // 获取所有唯一的来源目录
  const sourceDirs = computed(() => {
    const dirs = new Set<string>();
    scripts.value.forEach((s) => {
      if (s.sourceDir) {
        dirs.add(s.sourceDir);
      }
    });
    return Array.from(dirs).sort();
  });

  // 获取来源目录的简短显示名称
  const formatSourceName = (dir: string): string => {
    // 如果路径太长，显示最后 2 个部分
    const parts = dir.replace(/[\/\\]+$/, "").split(/[\/\\]/);
    if (parts.length <= 2) return dir;
    return `.../${parts.slice(-2).join("/")}`;
  };

  const filteredScripts = computed(() => {
    let result = scripts.value;

    // 按类型筛选
    if (selectedType.value !== "all") {
      result = result.filter((s) => s.type === selectedType.value);
    }

    // 按来源筛选
    if (selectedSource.value !== "all") {
      result = result.filter((s) => s.sourceDir === selectedSource.value);
    }

    // 按关键词搜索
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
        // 检查来源目录
        if (s.sourceDir && fuzzyMatch(s.sourceDir, kw).matched) return true;
        return false;
      });
    }

    return result.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  });

  const stats = computed(() => {
    const counts: Record<string, number> = {
      all: scripts.value.length
    };
    scripts.value.forEach((s) => {
      const type = s.type;
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  });

  return {
    keyword,
    selectedType,
    selectedSource,
    sourceDirs,
    formatSourceName,
    filteredScripts,
    stats
  };
}
