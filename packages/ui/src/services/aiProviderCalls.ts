/**
 * AI 提供商 API 调用模块
 * 处理 Anthropic、OpenAI、Custom 等提供商的非流式调用
 */

import type { AIProviderConfig } from '../utils/aiConfig';
import type { AIMetadataResponse, CommandCompletionResponse } from './aiTypes';
import { AIError } from './aiTypes';
import { parseMetadataResponse, parseCommandResponse } from './aiParsers';

const TIMEOUT = 30000; // 30 秒超时
const DEFAULT_MAX_TOKENS = 300; // 通用默认 token 数
const METADATA_MAX_TOKENS = 600; // 脚本元数据生成需要的 token 数

/**
 * 获取代理 URL
 */
export function getProxyUrl(originalUrl: string): string {
  // 国内 API 直接访问，不需要代理
  if (originalUrl.includes('volces.com')) {
    return originalUrl;
  }

  // 检测是否为开发环境
  const isDevEnv = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );

  if (!isDevEnv) return originalUrl;

  if (originalUrl.includes('api.anthropic.com')) {
    return '/api/anthropic/v1/messages';
  }
  if (originalUrl.includes('api.openai.com')) {
    return '/api/openai/v1/chat/completions';
  }
  if (originalUrl.includes('openrouter.ai')) {
    return '/api/openrouter/api/v1/chat/completions';
  }

  return originalUrl;
}

/**
 * 构建完整的自定义端点 URL
 */
export function buildCustomEndpointUrl(endpoint: string): string {
  let fullUrl = endpoint;
  if (!fullUrl.endsWith('/chat/completions')) {
    // 检查是否已包含 /api/v3 或类似路径
    if (fullUrl.endsWith('/api/v3') || fullUrl.endsWith('/v3') || fullUrl.endsWith('/v3/')) {
      fullUrl = fullUrl.replace(/\/$/, '') + '/chat/completions';
    } else {
      fullUrl = fullUrl.replace(/\/$/, '') + '/chat/completions';
    }
  }
  return fullUrl;
}

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
  console.log('[AI Service] Request body:', options.body);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('[AI Service] Response status:', response.status, response.statusText);

    if (!response.ok) {
      // 尝试读取错误响应
      let errorText = '';
      try {
        errorText = await response.text();
        console.error('[AI Service] Error response:', errorText);
      } catch (e) {
        // 忽略读取错误
      }

      if (response.status === 401 || response.status === 403) {
        throw createAIError('API Key 无效或已过期', 'auth', { statusCode: response.status, errorText });
      }
      if (response.status === 429) {
        throw createAIError('API 请求频率超限，请稍后重试', 'rate_limit');
      }
      if (response.status === 404) {
        throw createAIError('API 端点不存在，请检查自定义 API 端点配置', 'network', {
          statusCode: response.status,
          hint: '火山引擎端点应为: https://ark.cn-beijing.volces.com/v3/chat/completions',
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
 * 调用 Anthropic API
 */
export async function callAnthropic(
  config: AIProviderConfig,
  prompt: string,
  maxTokensParam?: number
): Promise<string> {
  const url = config.provider === 'openrouter'
    ? 'https://openrouter.ai/api/v1/chat/completions'
    : 'https://api.anthropic.com/v1/messages';

  const proxyUrl = getProxyUrl(url);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.apiKey}`,
  };

  if (config.provider === 'anthropic') {
    headers['anthropic-version'] = '2023-06-01';
  }

  if (config.provider === 'openrouter') {
    headers['HTTP-Referer'] = window.location.href;
    headers['X-Title'] = 'CommandSelector';
  }

  const maxTokens = maxTokensParam || config.maxTokens || DEFAULT_MAX_TOKENS;

  const body = config.provider === 'openrouter'
    ? {
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: config.temperature ?? 0.7,
        max_tokens: maxTokens,
      }
    : {
        model: config.model,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
        temperature: config.temperature ?? 0.7,
      };

  const response = await fetchWithTimeout(proxyUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (config.provider === 'openrouter') {
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw createAIError('AI 返回了空响应', 'invalid_response');
    }
    return content;
  } else {
    const content = data.content?.[0]?.text;
    if (!content) {
      throw createAIError('AI 返回了空响应', 'invalid_response');
    }
    return content;
  }
}

/**
 * 调用 OpenAI API
 */
export async function callOpenAI(
  config: AIProviderConfig,
  prompt: string,
  maxTokensParam?: number
): Promise<string> {
  const url = 'https://api.openai.com/v1/chat/completions';
  const proxyUrl = getProxyUrl(url);

  const maxTokens = maxTokensParam || config.maxTokens || DEFAULT_MAX_TOKENS;

  const response = await fetchWithTimeout(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: config.temperature ?? 0.7,
      max_tokens: maxTokens,
    }),
  });

  let data;
  try {
    data = await response.json();
    console.log('[AI Service] Response data:', JSON.stringify(data).slice(0, 500));
  } catch (e) {
    const text = await response.text().catch(() => '无法读取响应体');
    console.error('[AI Service] JSON parse error:', e, 'Response text:', text.slice(0, 500));
    throw createAIError('响应格式错误', 'invalid_response', { error: String(e), responseText: text.slice(0, 500) });
  }

  const content = data.choices?.[0]?.message?.content;
  console.log('[AI Service] Content:', content?.slice(0, 200));

  if (!content) {
    console.error('[AI Service] Empty content, data:', data);
    throw createAIError('AI 返回了空响应', 'invalid_response');
  }

  return content;
}

/**
 * 调用自定义 API
 */
export async function callCustom(
  config: AIProviderConfig,
  prompt: string,
  maxTokensParam?: number
): Promise<string> {
  if (!config.customEndpoint) {
    throw createAIError('未配置自定义 API 端点', 'auth');
  }

  const fullUrl = buildCustomEndpointUrl(config.customEndpoint);
  const proxyUrl = getProxyUrl(fullUrl);
  console.log('[AI Service] Original endpoint:', config.customEndpoint);
  console.log('[AI Service] Full URL:', fullUrl);
  console.log('[AI Service] Proxy URL:', proxyUrl);

  const maxTokens = maxTokensParam || config.maxTokens || DEFAULT_MAX_TOKENS;

  const response = await fetchWithTimeout(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: config.temperature ?? 0.7,
      max_tokens: maxTokens,
    }),
  });

  let data;
  try {
    data = await response.json();
    console.log('[AI Service] Response data:', JSON.stringify(data).slice(0, 500));
  } catch (e) {
    const text = await response.text().catch(() => '无法读取响应体');
    console.error('[AI Service] JSON parse error:', e, 'Response text:', text.slice(0, 500));
    throw createAIError('响应格式错误', 'invalid_response', { error: String(e), responseText: text.slice(0, 500) });
  }

  const content = data.choices?.[0]?.message?.content;
  console.log('[AI Service] Content:', content?.slice(0, 200));

  if (!content) {
    console.error('[AI Service] Empty content, data:', data);
    throw createAIError('AI 返回了空响应', 'invalid_response');
  }

  return content;
}

/**
 * 生成元数据 - 主入口
 */
export async function generateMetadata(
  config: AIProviderConfig,
  prompt: string
): Promise<AIMetadataResponse> {
  const content = await callProvider(config, prompt, METADATA_MAX_TOKENS);
  return parseMetadataResponse(content);
}

/**
 * 补全命令元数据 - 主入口
 */
export async function completeCommandMetadata(
  config: AIProviderConfig,
  prompt: string
): Promise<CommandCompletionResponse> {
  const content = await callProvider(config, prompt, DEFAULT_MAX_TOKENS);
  return parseCommandResponse(content);
}

/**
 * 调用提供商并返回原始内容
 */
async function callProvider(
  config: AIProviderConfig,
  prompt: string,
  maxTokens: number
): Promise<string> {
  switch (config.provider) {
    case 'anthropic':
    case 'openrouter':
      return await callAnthropic(config, prompt, maxTokens);
    case 'openai':
      return await callOpenAI(config, prompt, maxTokens);
    case 'custom':
      return await callCustom(config, prompt, maxTokens);
    default:
      throw createAIError(`不支持的 AI 服务提供商: ${config.provider}`, 'auth');
  }
}

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