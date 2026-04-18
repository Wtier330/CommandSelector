import { ref, computed } from "vue";
import { loadSearchConfig } from "../utils/searchConfig";

export interface SearchableItem {
  id: string;
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
}

export interface SearchScore {
  item: SearchableItem;
  score: number;
  matchDetails: {
    field: string;
    matchedText: string;
    weight: number;
  }[];
}

export interface SearchConfig {
  fieldWeights: {
    name: number;
    tag: number;
    description: number;
    content: number;
  };
  aliases: Record<string, string[]>;
  enablePinyin: boolean;
}

// 加载拼音库（懒加载）
let pinyinCache: Map<string, string> | null = null;
let pinyinPromise: Promise<any> | null = null;

export function useSmartSearch(items: Ref<SearchableItem[]>, config?: SearchConfig) {
  const searchKeyword = ref("");
  const currentConfig = computed(() => ({
    ...loadSearchConfig(),
    ...(config ?? {})
  }));

  // 展开关键词（别名）
  const expandedKeywords = computed(() => {
    if (!searchKeyword.value.trim()) return [];

    const k = searchKeyword.value.trim().toLowerCase();
    const aliases = currentConfig.value.aliases;

    // 检查别名映射
    if (aliases[k]) {
      return aliases[k];
    }

    // 添加原始词
    return [k];
  });

  // 计算搜索结果
  const searchResults = computed((): SearchScore[] => {
    if (!searchKeyword.value.trim()) {
      return items.value.map(item => ({
        item,
        score: 0,
        matchDetails: []
      }));
    }

    const k = searchKeyword.value.trim().toLowerCase();
    const weights = currentConfig.value.fieldWeights;
    const aliases = currentConfig.value.aliases;
    const enablePinyin = currentConfig.value.enablePinyin;

    return items.value
      .map(item => {
        let score = 0;
        const matchDetails: {
          field: "",
          matchedText: "",
          weight: 0
        }[];

        // 1. 名称匹配（最高权重）
        if (item.name.toLowerCase().includes(k)) {
          score += weights.name * 3;
          matchDetails.push({
            field: "name",
            matchedText: item.name,
            weight: weights.name
          });
        }

        // 2. 标签匹配
        if (item.tags && item.tags.some(tag => tag.toLowerCase().includes(k))) {
          score += weights.tag * 2;
          matchDetails.push({
            field: "tag",
            matchedText: item.tags?.find(tag => tag.toLowerCase().includes(k)) || "",
            weight: weights.tag
          });
        }

        // 3. 描述匹配
        if (item.description && item.description.toLowerCase().includes(k)) {
          score += weights.description * 1.5;
          matchDetails.push({
            field: "description",
            matchedText: item.description || "",
            weight: weights.description
          });
        }

        // 4. 类别匹配
        if (item.category && item.category.toLowerCase().includes(k)) {
          score += weights.description * 1;
        }

        // 5. 别名匹配（中等权重）
        for (const [alias, ...aliases] of expandedKeywords.value) {
          // 搜索所有字段
          const fields = [item.name, ...(item.tags || []), item.description ?? "", item.category ?? ""].join(" ").toLowerCase();
          if (fields.includes(alias)) {
            score += weights.content * 1;
            matchDetails.push({
              field: "alias",
              matchedText: alias,
              weight: weights.content
            });
          }
        }

        // 过滤低分结果
        return {
          item,
          score,
          matchDetails: matchDetails.filter(d => d.weight > 0)
        };
      })
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score);
  });

  function setSearchKeyword(keyword: string) {
    searchKeyword.value = keyword;
  }

  // 清除拼音缓存（用于测试）
  function clearPinyinCache() {
    pinyinCache = null;
    pinyinPromise = null;
  }

  return {
    searchKeyword,
    searchResults,
    expandedKeywords,
    setSearchKeyword,
    clearPinyinCache
  };
}
