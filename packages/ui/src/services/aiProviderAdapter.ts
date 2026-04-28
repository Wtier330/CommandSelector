/**
 * AI Provider Adapter 模式
 * 每个 provider 一个 adapter，封装 API 调用差异
 */

import type { AIProviderConfig, AIProvider } from '../utils/aiConfig';
import { AIError } from './aiTypes';

/**
 * 请求选项
 */
export interface RequestOptions {
  maxTokens: number;
  stream?: boolean;
}

/**
 * Provider Adapter 接口
 * 封装不同 AI 提供商的 API 差异
 */
export interface ProviderAdapter {
  /** 构建 API URL */
  buildUrl(config: AIProviderConfig): string;
  /** 构建请求头 */
  buildHeaders(config: AIProviderConfig): Record<string, string>;
  /** 构建请求体 */
  buildBody(prompt: string, config: AIProviderConfig, options: RequestOptions): object;
  /** 解析非流式响应，返回文本内容 */
  parseResponse(data: any): string;
  /** 是否支持真流式 */
  readonly supportsStreaming: boolean;
  /** 处理 SSE 流式响应，返回完整文本 */
  processStream(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    onChunk: (text: string) => void
  ): Promise<string>;
}

/**
 * 获取代理 URL
 * 开发环境通过 Vite 代理避免 CORS，生产环境直连
 */
export function getProxyUrl(originalUrl: string): string {
  const isDevEnv = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );

  if (!isDevEnv) return originalUrl;

  // 火山引擎代理
  if (originalUrl.includes('volces.com')) {
    return originalUrl.replace('https://ark.cn-beijing.volces.com', '/api/volces');
  }

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

// ============ Anthropic Adapter ============

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

export const anthropicAdapter: ProviderAdapter = {
  supportsStreaming: true,

  buildUrl() {
    return ANTHROPIC_URL;
  },

  buildHeaders(config) {
    return {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    };
  },

  buildBody(prompt, config, options) {
    return {
      model: config.model,
      max_tokens: options.maxTokens || config.maxTokens || 300,
      messages: [{ role: 'user', content: prompt }],
      temperature: config.temperature ?? 0.7,
      ...(options.stream ? { stream: true } : {}),
    };
  },

  parseResponse(data) {
    const content = data.content?.[0]?.text;
    if (!content) {
      throw new AIError('AI 返回了空响应', 'invalid_response');
    }
    return content;
  },

  async processStream(reader, onChunk) {
    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';
    let currentEvent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();

          if (trimmed.startsWith('event: ')) {
            currentEvent = trimmed.slice(7).trim();
          } else if (trimmed.startsWith('data: ') && currentEvent === 'content_block_delta') {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              const text = parsed.delta?.text;
              if (text) {
                fullContent += text;
                onChunk(text);
              }
            } catch {
              // 忽略解析错误
            }
          }

          // 空行重置事件类型
          if (trimmed === '') {
            currentEvent = '';
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullContent;
  },
};

// ============ OpenAI 兼容 Adapter 工厂 ============

function createOpenAICompatibleAdapter(options: {
  getUrl: (config: AIProviderConfig) => string;
  getExtraHeaders?: (config: AIProviderConfig) => Record<string, string>;
}): ProviderAdapter {
  return {
    supportsStreaming: true,

    buildUrl(config) {
      return options.getUrl(config);
    },

    buildHeaders(config) {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      };
      if (options.getExtraHeaders) {
        Object.assign(headers, options.getExtraHeaders(config));
      }
      return headers;
    },

    buildBody(prompt, config, reqOptions) {
      return {
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: config.temperature ?? 0.7,
        max_tokens: reqOptions.maxTokens || config.maxTokens || 300,
        ...(reqOptions.stream ? { stream: true } : {}),
      };
    },

    parseResponse(data) {
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new AIError('AI 返回了空响应', 'invalid_response');
      }
      return content;
    },

    async processStream(reader, onChunk) {
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
              if (data === '[DONE]') continue;

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
      } finally {
        reader.releaseLock();
      }

      console.log('[AI Service] Stream finished, chunks:', chunkCount, 'content length:', fullContent.length);
      return fullContent;
    },
  };
}

// ============ 具体 Adapter 实例 ============

export const openaiAdapter = createOpenAICompatibleAdapter({
  getUrl: () => 'https://api.openai.com/v1/chat/completions',
});

export const openrouterAdapter = createOpenAICompatibleAdapter({
  getUrl: () => 'https://openrouter.ai/api/v1/chat/completions',
  getExtraHeaders: () => ({
    'HTTP-Referer': window.location.href,
    'X-Title': 'CommandSelector',
  }),
});

export const customAdapter = createOpenAICompatibleAdapter({
  getUrl: (config) => {
    let url = config.customEndpoint || '';
    if (!url.endsWith('/chat/completions')) {
      url = url.replace(/\/$/, '') + '/chat/completions';
    }
    return url;
  },
});

// ============ 火山引擎 Adapter ============

export const volcengineAdapter = createOpenAICompatibleAdapter({
  getUrl: (config) => {
    const base = config.customEndpoint || 'https://ark.cn-beijing.volces.com/api/v3';
    return base.replace(/\/$/, '') + '/chat/completions';
  },
});

// ============ Adapter 选择器 ============

const ADAPTERS: Record<AIProvider, ProviderAdapter> = {
  anthropic: anthropicAdapter,
  openai: openaiAdapter,
  openrouter: openrouterAdapter,
  volcengine: volcengineAdapter,
  custom: customAdapter,
};

/**
 * 获取指定 provider 的 adapter
 */
export function getAdapter(provider: AIProvider): ProviderAdapter {
  const adapter = ADAPTERS[provider];
  if (!adapter) {
    throw new AIError(`不支持的 AI 服务提供商: ${provider}`, 'auth');
  }
  return adapter;
}
