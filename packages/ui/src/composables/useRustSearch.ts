/**
 * Rust 搜索命令调用封装
 * 封装 Tauri invoke 调用，将搜索逻辑委托给 Rust backend
 */
import { invoke } from "@tauri-apps/api/core";
import type { CommandEntry, ScriptFileMeta } from "@commandselector/shared";
import { getPinyinInitials } from "./usePinyinSearch";

// ==================== Rust 端类型定义（需与 lib.rs 保持一致） ====================

interface CommandSearchRequest {
  keyword: string;
  categories: string[];
  commands: CommandEntry[];
}

interface CommandSearchResult {
  filtered: CommandEntry[];
  matchCount: number;
}

interface ScriptSearchRequest {
  keyword: string;
  scripts: ScriptFileMeta[];
}

interface ScriptSearchResult {
  filtered: ScriptFileMeta[];
  matchCount: number;
}

// ==================== Composable ====================

/**
 * 判断关键词是否包含中文
 */
function hasChinese(str: string): boolean {
  return /[\u4e00-\u9fa5]/.test(str);
}

/**
 * 获取搜索关键词（支持模糊简拼）
 * 如果关键词包含中文，转换为拼音首字母一起搜索
 */
function getSearchKeyword(keyword: string): string {
  const trimmed = keyword.trim();
  if (!trimmed) return trimmed;

  // 如果包含中文，附加拼音首字母
  if (hasChinese(trimmed)) {
    const initials = getPinyinInitials(trimmed);
    if (initials) {
      // 原关键词 + 空格 + 拼音首字母，让 Rust 同时匹配两者
      return `${trimmed} ${initials}`;
    }
  }
  return trimmed;
}

export function useRustSearch() {
  /**
   * 搜索命令（由 Rust backend 执行过滤）
   */
  async function searchCommands(
    keyword: string,
    categories: string[],
    commands: CommandEntry[]
  ): Promise<CommandSearchResult> {
    const searchKeyword = getSearchKeyword(keyword);
    const request: CommandSearchRequest = {
      keyword: searchKeyword,
      categories,
      commands,
    };
    return invoke<CommandSearchResult>("search_commands", { request });
  }

  /**
   * 搜索脚本（由 Rust backend 执行过滤和拼音匹配）
   */
  async function searchScripts(
    keyword: string,
    scripts: ScriptFileMeta[]
  ): Promise<ScriptSearchResult> {
    const searchKeyword = getSearchKeyword(keyword);
    const request: ScriptSearchRequest = {
      keyword: searchKeyword,
      scripts,
    };
    return invoke<ScriptSearchResult>("search_scripts", { request });
  }

  return {
    searchCommands,
    searchScripts,
  };
}
