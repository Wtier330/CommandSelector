/**
 * AI 配置管理模块 - 支持多提供商配置
 */

export type AIProvider = 'anthropic' | 'openai' | 'openrouter' | 'custom';

export interface AIProviderConfig {
  id: string;
  name: string;
  provider: AIProvider;
  apiKey: string;
  model: string;
  customEndpoint?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIMultiConfig {
  providers: AIProviderConfig[];
  defaultProviderId: string | null;
}

const PROVIDER_DEFAULTS: Record<AIProvider, string> = {
  anthropic: 'claude-3-haiku-20240307',
  openai: 'gpt-3.5-turbo',
  openrouter: 'anthropic/claude-3-haiku',
  custom: ''
};

class AIConfigManager {
  private readonly CONFIG_KEY = 'cs_ai_config';

  /**
   * 获取多提供商配置
   */
  getMultiConfig(): AIMultiConfig {
    try {
      const saved = localStorage.getItem(this.CONFIG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.providers && Array.isArray(parsed.providers)) {
          return {
            providers: parsed.providers,
            defaultProviderId: parsed.defaultProviderId || null
          };
        }
      }
    } catch (error) {
      console.error('Failed to load AI config:', error);
    }
    return { providers: [], defaultProviderId: null };
  }

  /**
   * 保存多提供商配置
   */
  saveMultiConfig(config: AIMultiConfig): void {
    try {
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save AI config:', error);
      throw new Error('保存配置失败');
    }
  }

  /**
   * 获取默认提供商配置
   */
  getDefaultProvider(): AIProviderConfig | null {
    const config = this.getMultiConfig();
    if (config.defaultProviderId) {
      return config.providers.find(p => p.id === config.defaultProviderId) || null;
    }
    return config.providers.length > 0 ? config.providers[0] : null;
  }

  /**
   * 获取指定 ID 的提供商配置
   */
  getProvider(id: string): AIProviderConfig | null {
    const config = this.getMultiConfig();
    return config.providers.find(p => p.id === id) || null;
  }

  /**
   * 添加提供商
   */
  addProvider(provider: AIProviderConfig): void {
    const config = this.getMultiConfig();
    config.providers.push(provider);

    // 如果没有默认提供商，设置为这个
    if (!config.defaultProviderId) {
      config.defaultProviderId = provider.id;
    }

    this.saveMultiConfig(config);
  }

  /**
   * 更新提供商
   */
  updateProvider(id: string, updates: Partial<AIProviderConfig>): void {
    const config = this.getMultiConfig();
    const index = config.providers.findIndex(p => p.id === id);

    if (index !== -1) {
      config.providers[index] = { ...config.providers[index], ...updates };
      this.saveMultiConfig(config);
    }
  }

  /**
   * 删除提供商
   */
  deleteProvider(id: string): void {
    const config = this.getMultiConfig();
    const wasDefault = config.defaultProviderId === id;

    config.providers = config.providers.filter(p => p.id !== id);

    // 如果删除的是默认提供商，设置新的默认
    if (wasDefault && config.providers.length > 0) {
      config.defaultProviderId = config.providers[0].id;
    } else if (wasDefault) {
      config.defaultProviderId = null;
    }

    this.saveMultiConfig(config);
  }

  /**
   * 设置默认提供商
   */
  setDefaultProvider(id: string): void {
    const config = this.getMultiConfig();

    if (config.providers.find(p => p.id === id)) {
      config.defaultProviderId = id;
      this.saveMultiConfig(config);
    }
  }

  /**
   * 验证提供商配置
   */
  validateProvider(provider: AIProviderConfig): { valid: boolean; error?: string } {
    if (!provider.name || provider.name.trim() === '') {
      return { valid: false, error: '请输入提供商名称' };
    }

    if (!provider.apiKey || provider.apiKey.trim() === '') {
      return { valid: false, error: '请输入 API Key' };
    }

    if (!provider.model || provider.model.trim() === '') {
      return { valid: false, error: '请输入模型名称' };
    }

    if (provider.provider === 'custom' && (!provider.customEndpoint || provider.customEndpoint.trim() === '')) {
      return { valid: false, error: '自定义端点需要输入 API 地址' };
    }

    if (provider.temperature !== undefined && (provider.temperature < 0 || provider.temperature > 1)) {
      return { valid: false, error: '温度值应在 0 到 1 之间' };
    }

    if (provider.maxTokens !== undefined && provider.maxTokens < 1) {
      return { valid: false, error: '最大 Token 数应大于 0' };
    }

    return { valid: true };
  }

  /**
   * 清除所有配置
   */
  clearConfig(): void {
    try {
      localStorage.removeItem(this.CONFIG_KEY);
    } catch (error) {
      console.error('Failed to clear AI config:', error);
    }
  }

  /**
   * 获取提供商的默认模型
   */
  getDefaultModel(provider: AIProvider): string {
    return PROVIDER_DEFAULTS[provider];
  }

  /**
   * 生成唯一 ID
   */
  generateId(): string {
    return `provider_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 检查是否已配置
   */
  isConfigured(): boolean {
    const config = this.getMultiConfig();
    return config.providers.length > 0 && !!config.defaultProviderId;
  }
}

export const aiConfigManager = new AIConfigManager();
