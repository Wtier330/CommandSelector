import { computed, type Ref, type ComputedRef } from "vue";
import type { ScriptFileMeta } from "@commandselector/shared";

/**
 * 同名脚本去重分组
 * @param scripts - 脚本列表
 * @returns 分组结果和工具方法
 */
export function useScriptDedup(scripts: Ref<ScriptFileMeta[]>) {
  // 按名称分组（排除标记了 excludeFromDedup 的脚本）
  const nameGroups: ComputedRef<Map<string, ScriptFileMeta[]>> = computed(() => {
    const groups = new Map<string, ScriptFileMeta[]>();

    for (const script of scripts.value) {
      if (script.excludeFromDedup) continue;
      const existing = groups.get(script.name);
      if (existing) {
        existing.push(script);
      } else {
        groups.set(script.name, [script]);
      }
    }

    // 只保留有同名（>=2）的分组
    for (const [name, group] of groups) {
      if (group.length < 2) {
        groups.delete(name);
      }
    }

    return groups;
  });

  // 获取指定脚本的同名兄弟
  function getDuplicates(script: ScriptFileMeta): ScriptFileMeta[] {
    const group = nameGroups.value.get(script.name);
    if (!group) return [];
    return group.filter(s => s.id !== script.id);
  }

  // 脚本是否有同名重复
  function hasDuplicates(script: ScriptFileMeta): boolean {
    if (script.excludeFromDedup) return false;
    return nameGroups.value.has(script.name);
  }

  // 同名重复总数
  const duplicateNameCount: ComputedRef<number> = computed(() => nameGroups.value.size);

  return { nameGroups, getDuplicates, hasDuplicates, duplicateNameCount };
}
