// 搜索配置
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

export const defaultConfig: SearchConfig = {
  fieldWeights: {
    name: 100,
    tag: 80,
    description: 60,
    content: 30,
  },
  aliases: {
    'jb': ['句柄', 'job', 'handle', 'java', 'jupyter'],
    'wk': ['进程', 'work', 'workflow', 'worker', '端口', 'port'],
    'mem': ['内存', 'memory', 'ram'],
    'net': ['网络', 'network', 'connection', 'port'],
    'dh': ['端口', 'handle', 'port', 'network'],
  },
  enablePinyin: true,
};

// 从 localStorage 加载用户自定义配置
export function loadSearchConfig(): SearchConfig {
  try {
    const saved = localStorage.getItem('cs-search-config');
    if (saved) {
      return { ...defaultConfig, ...JSON.parse(saved) };
    }
  } catch {
    return defaultConfig;
  }
  return defaultConfig;
}

// 保存搜索配置
export function saveSearchConfig(config: Partial<SearchConfig>): void {
  try {
    localStorage.setItem('cs-search-config', JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save search config:', e);
  }
}

// 重置为默认配置
export function resetSearchConfig(): void {
  saveSearchConfig(defaultConfig);
}
