/**
 * AI 流式调用模块
 * 基于 Provider Adapter 模式，所有 provider 均支持真流式
 */

import type { AIProviderConfig } from '../utils/aiConfig';
import type { CommandCompletionResponse } from './aiTypes';
import { AIError, AI_CONSTANTS } from './aiTypes';
import { parseCommandResponse, formatCommandResponse } from './aiParsers';
import { getAdapter, getProxyUrl } from './aiProviderAdapter';
import { buildCommandCompletionPrompt, type CommandInfo } from './aiPromptBuilder';

const STREAM_TIMEOUT = 60000; // 流式请求超时 60s
const SIMULATED_STREAM_DELAY = 15; // 模拟流式延迟(ms)

/**
 * 格式化命令响应为文本（用于模拟流式）
 */
export function formatCommandResponseForStream(response: CommandCompletionResponse): string {
  return formatCommandResponse(response);
}

/**
 * 模拟流式输出：逐字符发送
 */
async function simulateStream(
  text: string,
  onChunk: (text: string) => void
): Promise<void> {
  for (const char of text) {
    onChunk(char);
    await new Promise(resolve => setTimeout(resolve, SIMULATED_STREAM_DELAY));
  }
}

/**
 * 通用流式调用 - 通过 Adapter 模式统一处理
 * 支持 true 流式（SSE），不支持时 fallback 到非流式 + 模拟
 */
async function streamCommand(
  config: AIProviderConfig,
  prompt: string,
  onChunk: (text: string) => void,
  onStage?: (stage: string) => void
): Promise<CommandCompletionResponse> {
  const adapter = getAdapter(config.provider);
  const maxTokens = config.maxTokens ?? AI_CONSTANTS.DEFAULT_MAX_TOKENS;

  onStage?.('生成中');

  if (adapter.supportsStreaming) {
    // 真流式调用
    return await realStreamCall(adapter, config, prompt, maxTokens, onChunk, onStage);
  }

  // 非流式调用 + 模拟流式输出
  return await simulatedStreamCall(config, prompt, maxTokens, onChunk, onStage);
}

/**
 * 真流式 SSE 调用
 */
async function realStreamCall(
  adapter: ReturnType<typeof getAdapter>,
  config: AIProviderConfig,
  prompt: string,
  maxTokens: number,
  onChunk: (text: string) => void,
  onStage?: (stage: string) => void
): Promise<CommandCompletionResponse> {
  const url = getProxyUrl(adapter.buildUrl(config));
  const headers = adapter.buildHeaders(config);
  const body = adapter.buildBody(prompt, config, { maxTokens, stream: true });

  console.log('[AI Service] Real stream, provider:', config.provider, 'url:', url);
  onStage?.('生成中');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), STREAM_TIMEOUT);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new AIError(`API 请求失败: ${response.status} ${response.statusText}`, 'network', {
        statusCode: response.status,
        errorText,
      });
    }

    if (!response.body) {
      throw new AIError('响应体为空', 'invalid_response');
    }

    const fullContent = await adapter.processStream(response.body.getReader(), onChunk);

    onStage?.('解析中');
    return parseCommandResponse(fullContent);
  } catch (error) {
    clearTimeout(timeoutId);

    // 自定义端点流式失败时 fallback 到非流式
    if (config.provider === 'custom' && error instanceof Error && !(error instanceof AIError)) {
      console.warn('[AI Service] Custom stream failed, falling back to non-streaming:', error);
      return await simulatedStreamCall(config, prompt, maxTokens, onChunk, onStage);
    }

    if (error instanceof AIError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AIError('请求超时，请检查网络连接', 'timeout');
    }
    throw error;
  }
}

/**
 * 非流式调用 + 模拟流式输出（fallback）
 */
async function simulatedStreamCall(
  config: AIProviderConfig,
  prompt: string,
  maxTokens: number,
  onChunk: (text: string) => void,
  onStage?: (stage: string) => void
): Promise<CommandCompletionResponse> {
  onStage?.('生成中');

  const { callProvider } = await import('./aiProviderCalls');
  const content = await callProvider(config, prompt, maxTokens);
  const result = parseCommandResponse(content);

  // 模拟流式输出
  const text = formatCommandResponse(result);
  await simulateStream(text, onChunk);

  return result;
}

/**
 * 主流式调用入口
 */
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

  const prompt = await buildCommandCompletionPrompt(command);
  onStage?.('分析中');

  return await streamCommand(config, prompt, onChunk, onStage);
}

/**
 * 测试连接 - 使用 Adapter 构建 provider 专用请求
 */
export async function testConnection(config: AIProviderConfig): Promise<boolean> {
  try {
    const adapter = getAdapter(config.provider);
    const url = getProxyUrl(adapter.buildUrl(config));
    const headers = adapter.buildHeaders(config);
    const body = adapter.buildBody('hi', config, { maxTokens: 1 });

    console.log('[AI Service] Test connection, provider:', config.provider, 'url:', url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (controller.signal.aborted) {
      throw new AIError('连接超时，请检查网络', 'timeout');
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      if (response.status === 401 || response.status === 403) {
        throw new AIError('API Key 无效或已过期', 'auth', { statusCode: response.status, errorText });
      }
      throw new AIError(`连接失败: ${response.status} ${response.statusText}`, 'network', {
        statusCode: response.status,
        errorText,
      });
    }

    return true;
  } catch (error) {
    if (error instanceof AIError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AIError('连接超时，请检查网络', 'timeout');
    }
    throw new AIError('连接失败', 'network', { originalError: error });
  }
}

// 重新导出 CommandInfo 类型（向后兼容）
export type { CommandInfo } from './aiPromptBuilder';
