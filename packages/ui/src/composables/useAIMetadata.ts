/**
 * AI 元数据生成 Composable
 * 封装状态管理和业务逻辑 - 支持多提供商
 */

import { ref, computed } from 'vue';
import { aiService, type AIMetadataResponse, AIError } from '../services/aiService';
import { aiConfigManager, type AIProviderConfig } from '../utils/aiConfig';
import type { ParsedScriptMetadata } from '../utils/scriptCommentParser';

export function useAIMetadata() {
  const isGenerating = ref(false);
  const error = ref<AIError | null>(null);

  // 多提供商配置
  const providers = ref<AIProviderConfig[]>([]);
  const defaultProviderId = ref<string | null>(null);

  const isConfigured = computed(() => {
    return providers.value.length > 0 && !!defaultProviderId.value;
  });

  const defaultProvider = computed(() => {
    if (!defaultProviderId.value) return null;
    return providers.value.find(p => p.id === defaultProviderId.value) || null;
  });

  /**
   * 加载所有提供商配置
   */
  async function loadProviders() {
    const config = await aiConfigManager.getMultiConfig();
    providers.value = config.providers;
    defaultProviderId.value = config.defaultProviderId;
  }

  /**
   * 生成元数据（使用默认提供商）
   */
  async function generateMetadata(
    scriptContent: string,
    scriptType: 'bat' | 'ps1'
  ): Promise<ParsedScriptMetadata | null> {
    isGenerating.value = true;
    error.value = null;

    try {
      const provider = defaultProvider.value;
      if (!provider) {
        throw new AIError('AI 服务未配置，请在设置中配置提供商', 'auth', {
          requiresConfiguration: true,
        });
      }

      const response = await aiService.generateMetadata(
        scriptContent,
        scriptType,
        provider
      );

      return transformResponse(response);
    } catch (err) {
      if (err instanceof AIError) {
        error.value = err;
      } else {
        error.value = new AIError(String(err), 'network', { originalError: err });
      }
      return null;
    } finally {
      isGenerating.value = false;
    }
  }

  /**
   * 测试指定提供商的连接
   */
  async function testConnection(provider: AIProviderConfig): Promise<boolean> {
    error.value = null;

    try {
      await aiService.testConnection(provider);
      return true;
    } catch (err) {
      if (err instanceof AIError) {
        error.value = err;
      } else {
        error.value = new AIError(String(err), 'network', { originalError: err });
      }
      return false;
    }
  }

  /**
   * 添加提供商
   */
  async function addProvider(provider: AIProviderConfig): Promise<{ valid: boolean; error?: string }> {
    const validation = aiConfigManager.validateProvider(provider);
    if (validation.valid) {
      await aiConfigManager.addProvider(provider);
      await loadProviders();
    }
    return validation;
  }

  /**
   * 更新提供商
   */
  async function updateProvider(id: string, updates: Partial<AIProviderConfig>): Promise<{ valid: boolean; error?: string }> {
    const existing = await aiConfigManager.getProvider(id);
    if (!existing) {
      return { valid: false, error: '提供商不存在' };
    }

    const updated = { ...existing, ...updates };
    const validation = aiConfigManager.validateProvider(updated);
    if (validation.valid) {
      await aiConfigManager.updateProvider(id, updates);
      await loadProviders();
    }
    return validation;
  }

  /**
   * 删除提供商
   */
  async function deleteProvider(id: string) {
    await aiConfigManager.deleteProvider(id);
    await loadProviders();
  }

  /**
   * 设置默认提供商
   */
  async function setDefaultProvider(id: string) {
    await aiConfigManager.setDefaultProvider(id);
    defaultProviderId.value = id;
  }

  /**
   * 清除错误
   */
  function clearError() {
    error.value = null;
  }

  /**
   * 清除所有配置
   */
  async function clearConfig() {
    await aiConfigManager.clearConfig();
    await loadProviders();
  }

  /**
   * 获取指定提供商的默认模型
   */
  function getDefaultModel(providerType: string): string {
    return aiConfigManager.getDefaultModel(providerType as any);
  }

  return {
    isGenerating,
    error,
    providers,
    defaultProviderId,
    defaultProvider,
    isConfigured,
    generateMetadata,
    testConnection,
    addProvider,
    updateProvider,
    deleteProvider,
    setDefaultProvider,
    clearError,
    clearConfig,
    loadProviders,
    getDefaultModel,
  };
}

/**
 * 将 AI 响应转换为 ParsedScriptMetadata
 */
function transformResponse(response: AIMetadataResponse): ParsedScriptMetadata {
  return {
    name: response.name || '未命名脚本',
    shortDescription: response.shortDescription,
    description: response.description || '脚本描述',
    category: response.category || '未分类',
    tags: Array.isArray(response.tags) ? response.tags : [],
    requires: response.requires,
    platform: response.platform || 'Windows',
    version: response.version || '1.0.0',
    author: response.author,
    usage: response.usage,
    params: Array.isArray(response.params) ? response.params : [],
    examples: Array.isArray(response.examples) ? response.examples : [],
    notes: response.notes,
  };
}
