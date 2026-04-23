/**
 * 命令库 AI 补全 Composable
 * 基于已有信息补全命令的元数据字段
 */

import { ref, computed } from 'vue';
import { aiService, type CommandCompletionResponse, AIError } from '../services/aiService';
import { aiConfigManager, type AIProviderConfig } from '../utils/aiConfig';
import type { CommandEntry } from '@commandselector/shared';

export function useCommandAIMetadata() {
  const isCompleting = ref(false);
  const isStreaming = ref(false);
  const streamingContent = ref('');
  const streamingStage = ref('');
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
   * 补全命令元数据
   */
  async function completeMetadata(
    command: Partial<CommandEntry>
  ): Promise<Partial<CommandEntry> | null> {
    isCompleting.value = true;
    error.value = null;

    try {
      const provider = defaultProvider.value;
      if (!provider) {
        throw new AIError('AI 服务未配置，请在设置中配置提供商', 'auth', {
          requiresConfiguration: true,
        });
      }

      const response = await aiService.completeCommandMetadata(command, provider);

      // 将响应转换为 CommandEntry 的部分字段
      return transformResponse(response);
    } catch (err) {
      if (err instanceof AIError) {
        error.value = err;
      } else {
        error.value = new AIError(String(err), 'network', { originalError: err });
      }
      return null;
    } finally {
      isCompleting.value = false;
    }
  }

  /**
   * 流式补全命令元数据
   */
  async function completeMetadataStream(
    command: Partial<CommandEntry>
  ): Promise<Partial<CommandEntry> | null> {
    isCompleting.value = true;
    isStreaming.value = true;
    streamingContent.value = '';
    streamingStage.value = '';
    error.value = null;

    try {
      const provider = defaultProvider.value;
      if (!provider) {
        throw new AIError('AI 服务未配置，请在设置中配置提供商', 'auth', {
          requiresConfiguration: true,
        });
      }

      const response = await aiService.completeCommandMetadataStream(
        command,
        provider,
        (chunk) => {
          streamingContent.value += chunk;
        },
        (stage) => {
          streamingStage.value = stage;
        }
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
      isCompleting.value = false;
      isStreaming.value = false;
      streamingStage.value = '';
    }
  }

  /**
   * 测试指定提供商的连接
   */
  async function testConnection(provider: AIProviderConfig): Promise<boolean> {
    error.value = null;

    try {
      // 使用最小请求快速测试连接（max_tokens=1）
      const result = await aiService.generateMetadata('a', 'bat', {
        ...provider,
        maxTokens: 1, // 只生成1个token，快速验证
      });
      return !!result;
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
   * 清除错误
   */
  function clearError() {
    error.value = null;
  }

  return {
    isCompleting,
    isStreaming,
    streamingContent,
    streamingStage,
    error,
    providers,
    defaultProviderId,
    defaultProvider,
    isConfigured,
    completeMetadata,
    completeMetadataStream,
    testConnection,
    clearError,
    loadProviders,
  };
}

/**
 * 将 AI 响应转换为命令的部分字段
 */
function transformResponse(response: CommandCompletionResponse): Partial<CommandEntry> {
  const result: Partial<CommandEntry> = {};

  if (response.description) {
    result.description = response.description;
  }
  if (response.category) {
    result.category = response.category;
  }
  if (response.tags && response.tags.length > 0) {
    result.tags = response.tags;
  }
  if (response.usage) {
    result.usage = response.usage;
  }

  return result;
}