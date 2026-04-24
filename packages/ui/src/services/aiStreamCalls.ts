/**
 * AI 流式调用模块
 * 处理流式响应和模拟流式效果
 */

import type { AIProviderConfig } from '../utils/aiConfig';
import type { CommandCompletionResponse } from './aiTypes';
import { AIError } from './aiTypes';
import { parseCommandResponse } from './aiParsers';
import { getProxyUrl } from './aiProviderCalls';
import { buildCommandCompletionPrompt } from './aiPromptBuilder';

const DEFAULT_MAX_TOKENS = 300; // 通用默认 token 数

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 格式化命令响应为文本
 */
export function formatCommandResponseForStream(response: CommandCompletionResponse): string {
  const parts: string[] = [];
  if (response.description) parts.push(`描述: ${response.description}`);
  if (response.category) parts.push(`分类: ${response.category}`);
  if (response.tags?.length) parts.push(`标签: ${response.tags.join(', ')}`);
  if (response.usage) parts.push(`使用说明: ${response.usage}`);
  return parts.join('\n');
}

/**
 * Anthropic 流式调用（模拟流式，因为不支持真流式）
 */
export async function streamAnthropicCommand(
  config: AIProviderConfig,
  prompt: string,
  onChunk: (text: string) => void,
  onStage?: (stage: string) => void
): Promise<CommandCompletionResponse> {
  onStage?.('生成中');

  // 调用非流式 API
  const { callAnthropic } = await import('./aiProviderCalls');
  const content = await callAnthropic(config, prompt, DEFAULT_MAX_TOKENS);
  const result = parseCommandResponse(content);

  // 模拟流式输出
  const text = formatCommandResponseForStream(result);
  for (const char of text) {
    onChunk(char);
    await delay(15);
  }

  return result;
}

/**
 * OpenAI 流式调用
 */
export async function streamOpenAICommand(
  config: AIProviderConfig,
  prompt: string,
  onChunk: (text: string) => void,
  onStage?: (stage: string) => void
): Promise<CommandCompletionResponse> {
  let fullUrl = config.customEndpoint || 'https://api.openai.com/v1/chat/completions';
  if (config.provider === 'openrouter') {
    fullUrl = 'https://openrouter.ai/api/v1/chat/completions';
  }

  // 构建完整的 API URL
  if (config.provider === 'custom' && config.customEndpoint) {
    fullUrl = config.customEndpoint;
    if (!fullUrl.endsWith('/chat/completions')) {
      fullUrl = fullUrl.replace(/\/$/, '') + '/chat/completions';
    }
  }

  const proxyUrl = getProxyUrl(fullUrl);
  console.log('[AI Service] streamOpenAICommand, fullUrl:', fullUrl, 'proxyUrl:', proxyUrl);
  onStage?.('生成中');

  // 使用 AbortController 添加超时
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const maxTokens = config.maxTokens ?? DEFAULT_MAX_TOKENS;

    const response = await fetch(proxyUrl, {
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
        stream: true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log('[AI Service] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new AIError(`API 请求失败: ${response.status} ${response.statusText}`, 'network', { statusCode: response.status, errorText });
    }

    if (!response.body) {
      throw new AIError('响应体为空', 'invalid_response');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';
    let chunkCount = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              console.log('[AI Service] Stream done, chunks:', chunkCount);
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                onChunk(content);
                chunkCount++;
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }
      console.log('[AI Service] Stream finished, total chunks:', chunkCount, 'content length:', fullContent.length);
    } finally {
      reader.releaseLock();
    }

    onStage?.('解析中');
    return parseCommandResponse(fullContent);
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('[AI Service] Stream error:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AIError('请求超时，请检查网络连接', 'timeout');
    }
    throw error;
  }
}

/**
 * 自定义 API 流式调用（火山引擎用非流式）
 */
export async function streamCustomCommand(
  config: AIProviderConfig,
  prompt: string,
  onChunk: (text: string) => void,
  onStage?: (stage: string) => void
): Promise<CommandCompletionResponse> {
  console.log('[AI Service] streamCustomCommand called, endpoint:', config.customEndpoint);

  onStage?.('生成中');

  // 调用非流式 API
  const { callCustom } = await import('./aiProviderCalls');
  const content = await callCustom(config, prompt, DEFAULT_MAX_TOKENS);
  const result = parseCommandResponse(content);

  // 模拟流式输出
  const text = formatCommandResponseForStream(result);
  for (const char of text) {
    onChunk(char);
    await delay(15);
  }

  return result;
}

/**
 * 主流式调用入口
 */
export interface CommandInfo {
  name?: string;
  description?: string;
  category?: string;
  tags?: string[];
  template?: string;
  powershellTemplate?: string;
  usage?: string;
  platform?: string;
}

export async function completeCommandMetadataStream(
  command: CommandInfo,
  config: AIProviderConfig,
  onChunk: (text: string) => void,
  onStage?: (stage: string) => void
): Promise<CommandCompletionResponse> {
  console.log('[AI Service] stream start, provider:', config.provider, 'endpoint:', config.customEndpoint);

  if (!config.apiKey || config.apiKey.length === 0) {
    throw new AIError('API Key 未配置', 'auth');
  }

  const prompt = buildCommandCompletionPrompt(command);
  onStage?.('分析中');

  // 根据提供商调用对应的流式 API
  switch (config.provider) {
    case 'anthropic':
      return await streamAnthropicCommand(config, prompt, onChunk, onStage);
    case 'openrouter':
      return await streamOpenAICommand(config, prompt, onChunk, onStage);
    case 'openai':
      return await streamOpenAICommand(config, prompt, onChunk, onStage);
    case 'custom':
      return await streamCustomCommand(config, prompt, onChunk, onStage);
    default:
      throw new AIError(`不支持的 AI 服务提供商: ${config.provider}`, 'auth');
  }
}

/**
 * 测试连接
 */
export async function testConnection(config: AIProviderConfig): Promise<boolean> {
  try {
    // 构建 API URL
    let url = config.customEndpoint || 'https://api.openai.com/v1/chat/completions';
    if (config.provider === 'anthropic') {
      url = 'https://api.anthropic.com/v1/messages';
    } else if (config.provider === 'openrouter') {
      url = 'https://openrouter.ai/api/v1/chat/completions';
    }

    if (!url.endsWith('/chat/completions') && !url.endsWith('/messages')) {
      url = url.replace(/\/$/, '') + '/chat/completions';
    }

    const proxyUrl = getProxyUrl(url);

    // 发送一个极简请求，只验证连通性
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

    await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 1, // 最少生成
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (controller.signal.aborted) {
      throw new AIError('连接超时，请检查网络', 'timeout');
    }

    return true;
  } catch (error) {
    if (error instanceof AIError) {
      throw error;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AIError('连接超时，请检查网络', 'timeout');
    }
    throw new AIError('连接失败', 'network', { originalError: error });
  }
}