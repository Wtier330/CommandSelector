/**
 * AI 提供商 API 调用模块
 * 基于 Provider Adapter 模式的非流式调用
 */

import type { AIProviderConfig } from '../utils/aiConfig';
import type { AIMetadataResponse, CommandCompletionResponse } from './aiTypes';
import { AIError, AI_CONSTANTS } from './aiTypes';
import { parseMetadataResponse, parseCommandResponse } from './aiParsers';
import { getAdapter, getProxyUrl } from './aiProviderAdapter';

const TIMEOUT = AI_CONSTANTS.TIMEOUT;

/**
 * 带超时的 fetch 请求
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

  console.log('[AI Service] Fetching:', url);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('[AI Service] Response status:', response.status, response.statusText);

    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
        console.error('[AI Service] Error response:', errorText);
      } catch {
        // 忽略读取错误
      }

      if (response.status === 401 || response.status === 403) {
        throw createAIError('API Key 无效或已过期', 'auth', { statusCode: response.status, errorText });
      }
      if (response.status === 429) {
        throw createAIError('API 请求频率超限，请稍后重试', 'rate_limit');
      }
      if (response.status === 404) {
        throw createAIError('API 端点不存在，请检查 API 端点配置', 'network', {
          statusCode: response.status,
          errorText,
        });
      }
      throw createAIError(`API 请求失败: ${response.status} ${response.statusText}`, 'network', {
        statusCode: response.status,
        errorText,
      });
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof AIError) throw error;
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw createAIError('请求超时，请检查网络连接', 'timeout');
      }
      if (error instanceof TypeError) {
        throw createAIError('网络连接失败，请检查网络设置', 'network', { originalError: error });
      }
    }
    throw error;
  }
}

/**
 * 通用非流式调用 - 通过 Adapter 模式统一处理
 */
export async function callProvider(
  config: AIProviderConfig,
  prompt: string,
  maxTokensParam?: number
): Promise<string> {
  const adapter = getAdapter(config.provider);
  const url = getProxyUrl(adapter.buildUrl(config));
  const headers = adapter.buildHeaders(config);
  const maxTokens = maxTokensParam || config.maxTokens || AI_CONSTANTS.DEFAULT_MAX_TOKENS;
  const body = adapter.buildBody(prompt, config, { maxTokens, stream: false });

  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  let data;
  try {
    data = await response.json();
    console.log('[AI Service] Response data:', JSON.stringify(data).slice(0, 500));
  } catch (e) {
    const text = await response.text().catch(() => '无法读取响应体');
    throw createAIError('响应格式错误', 'invalid_response', { error: String(e), responseText: text.slice(0, 500) });
  }

  return adapter.parseResponse(data);
}

/**
 * 生成元数据 - 主入口
 */
export async function generateMetadata(
  config: AIProviderConfig,
  prompt: string
): Promise<AIMetadataResponse> {
  const content = await callProvider(config, prompt, AI_CONSTANTS.METADATA_MAX_TOKENS);
  return parseMetadataResponse(content);
}

/**
 * 补全命令元数据 - 主入口
 */
export async function completeCommandMetadata(
  config: AIProviderConfig,
  prompt: string
): Promise<CommandCompletionResponse> {
  const content = await callProvider(config, prompt, AI_CONSTANTS.DEFAULT_MAX_TOKENS);
  return parseCommandResponse(content);
}

// 重新导出 getProxyUrl 供其他模块使用
export { getProxyUrl } from './aiProviderAdapter';

/**
 * 创建 AI 错误
 */
function createAIError(
  message: string,
  code: 'network' | 'timeout' | 'auth' | 'rate_limit' | 'invalid_response',
  details?: any
): AIError {
  return new AIError(message, code, details);
}
