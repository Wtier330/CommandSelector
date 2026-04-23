/**
 * 拼音搜索 composable
 * 使用 pinyin-pro 库实现准确的拼音首字母搜索
 */
import * as pinyinPro from "pinyin-pro";

// 获取 pinyin 函数
const pinyin = (pinyinPro as any).pinyin || (pinyinPro as any).default?.pinyin;

// 缓存
const pinyinCache = new Map<string, string>();
const fullPinyinCache = new Map<string, string>();

/**
 * 获取字符串的拼音首字母
 * @param str 输入字符串
 * @returns 拼音首字母串，如 "测试" -> "cs"
 */
export function getPinyinInitials(str: string): string {
  if (!str) return "";

  if (pinyinCache.has(str)) {
    return pinyinCache.get(str)!;
  }

  let result = "";
  if (pinyin) {
    try {
      result = pinyin(str, {
        pattern: "initial",
        toneType: "none",
      }).replace(/[^a-z]/gi, "").toLowerCase();
    } catch {
      result = "";
    }
  }

  pinyinCache.set(str, result);
  return result;
}

/**
 * 获取字符串的完整拼音
 * @param str 输入字符串
 * @returns 全拼字符串，如 "测试" -> "ce shi"
 */
export function getPinyinFull(str: string): string {
  if (!str) return "";

  if (fullPinyinCache.has(str)) {
    return fullPinyinCache.get(str)!;
  }

  let result = "";
  if (pinyin) {
    try {
      result = pinyin(str, {
        pattern: "pinyin",
        toneType: "none",
      }).replace(/[^a-z\s]/gi, "").toLowerCase();
    } catch {
      result = "";
    }
  }

  fullPinyinCache.set(str, result);
  return result;
}

export interface PinyinSearchResult {
  matched: boolean;
  matchedText?: string;
  matchType?: "exact" | "pinyin" | "initial";
}

/**
 * 模糊匹配文本与关键词
 * 支持：直接匹配、拼音匹配、首字母匹配
 */
export function fuzzyMatch(text: string, keyword: string): PinyinSearchResult {
  if (!text || !keyword) {
    return { matched: false };
  }

  const lowerText = text.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();

  // 1. 直接包含匹配
  if (lowerText.includes(lowerKeyword)) {
    return {
      matched: true,
      matchedText: text,
      matchType: "exact",
    };
  }

  // 2. 完整拼音匹配
  const fullPinyin = getPinyinFull(text);
  if (fullPinyin.includes(lowerKeyword)) {
    return {
      matched: true,
      matchedText: fullPinyin,
      matchType: "pinyin",
    };
  }

  // 3. 首字母匹配
  const initials = getPinyinInitials(text);
  const keywordInitials = getPinyinInitials(keyword);

  // 调试日志
  console.debug("[pinyin-search]", {
    text,
    keyword,
    initials,
    keywordInitials,
    includes: initials.includes(keywordInitials),
  });

  if (initials.includes(keywordInitials)) {
    return {
      matched: true,
      matchedText: initials,
      matchType: "initial",
    };
  }

  // 4. 首字母连续匹配（更宽松）
  let keywordIdx = 0;
  for (const char of initials) {
    if (keywordIdx < keywordInitials.length && char === keywordInitials[keywordIdx]) {
      keywordIdx++;
      if (keywordIdx === keywordInitials.length) {
        return {
          matched: true,
          matchedText: initials,
          matchType: "initial",
        };
      }
    }
  }

  return { matched: false };
}

/**
 * 清除拼音缓存
 */
export function clearPinyinCache(): void {
  pinyinCache.clear();
  fullPinyinCache.clear();
}

export function usePinyinSearch() {
  return {
    getPinyinInitials,
    getPinyinFull,
    fuzzyMatch,
    clearPinyinCache,
  };
}
