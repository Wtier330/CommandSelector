/**
 * AI 服务调用模块
 * 处理 AI API 调用、超时、重试、错误处理
 */

import type { AIProviderConfig } from '../utils/aiConfig';

export interface AIMetadataResponse {
  name: string;
  description: string;
  category: string;
  tags: string[];
  requires?: string;
  platform?: string;
  version?: string;
  author?: string;
  usage?: string;
  params?: Array<{ name: string; desc: string }>;
  examples?: string[];
  notes?: string;
}

export class AIError extends Error {
  constructor(
    message: string,
    public code: 'network' | 'timeout' | 'auth' | 'rate_limit' | 'invalid_response',
    public details?: any
  ) {
    super(message);
    this.name = 'AIError';
  }
}

class AIService {
  private readonly TIMEOUT = 30000; // 30 秒超时

  // 检测是否为开发环境
  private isDevEnv(): boolean {
    return typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    );
  }

  // 获取代理 URL（仅开发环境）
  private getProxyUrl(originalUrl: string): string {
    if (!this.isDevEnv()) return originalUrl;

    if (originalUrl.includes('api.anthropic.com')) {
      return '/api/anthropic/v1/messages';
    }
    if (originalUrl.includes('api.openai.com')) {
      return '/api/openai/v1/chat/completions';
    }
    if (originalUrl.includes('openrouter.ai')) {
      return '/api/openrouter/api/v1/chat/completions';
    }
    if (originalUrl.includes('volces.com')) {
      // 提取 volces API 的路径部分
      // 匹配 URL 格式: https://ark.cn-beijing.volces.com/api/v3
      const match = originalUrl.match(/\/\/[^\/]+\/(.+)/);
      if (match) {
        const path = match[1]; // 提取路径部分，如 "api/v3"
        return `/api/volces/${path}`;
      }
    }

    return originalUrl;
  }

  async generateMetadata(
    scriptContent: string,
    scriptType: 'bat' | 'ps1',
    config: AIProviderConfig
  ): Promise<AIMetadataResponse> {
    // 验证配置
    if (!config.apiKey || config.apiKey.length === 0) {
      throw new AIError('API Key 未配置', 'auth');
    }

    // 构建提示词
    const prompt = this.buildPrompt(scriptContent, scriptType);

    // 根据提供商调用对应的 API
    switch (config.provider) {
      case 'anthropic':
      case 'openrouter':
        return await this.callAnthropic(config, prompt);
      case 'openai':
        return await this.callOpenAI(config, prompt);
      case 'custom':
        return await this.callCustom(config, prompt);
      default:
        throw new AIError(`不支持的 AI 服务提供商: ${config.provider}`, 'auth');
    }
  }

  private buildPrompt(scriptContent: string, scriptType: 'bat' | 'ps1'): string {
    const scriptTypeName = scriptType === 'bat' ? 'BAT (批处理)' : 'PowerShell';
    return `你是一个专业的 Windows 脚本元数据生成助手。请分析以下 ${scriptTypeName} 脚本，并生成结构化的元数据。

要求：
1. 基于脚本的实际功能生成准确的名称和描述
2. 根据脚本内容推断合适的分类（如：系统管理、文件操作、网络工具、开发工具等）
3. 提取相关的标签
4. 识别参数和示例
5. 返回格式必须为有效的 JSON，不要包含任何其他文本
6. 如果脚本内容为空或无法分析，返回默认值

脚本内容：
\`\`\`${scriptType}
${scriptContent}
\`\`\`

请返回以下格式的 JSON（不要包含任何其他文本，不要使用 markdown 代码块）：
{
  "name": "脚本名称",
  "description": "详细的功能描述，50-200字",
  "category": "分类",
  "tags": ["标签1", "标签2"],
  "requires": "权限要求（如需要管理员权限等）",
  "platform": "Windows",
  "version": "1.0.0",
  "usage": "使用说明",
  "params": [
    {"name": "参数名", "desc": "参数说明"}
  ],
  "examples": ["示例1"],
  "notes": "备注信息"
}`;
  }

  private async callAnthropic(config: AIProviderConfig, prompt: string): Promise<AIMetadataResponse> {
    const url = config.provider === 'openrouter'
      ? 'https://openrouter.ai/api/v1/chat/completions'
      : 'https://api.anthropic.com/v1/messages';

    const proxyUrl = this.getProxyUrl(url);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      'anthropic-version': '2023-06-01',
    };

    if (config.provider === 'openrouter') {
      headers['HTTP-Referer'] = window.location.href;
      headers['X-Title'] = 'CommandSelector';
    }

    const body = config.provider === 'openrouter'
      ? {
          model: config.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: config.temperature ?? 0.7,
          max_tokens: config.maxTokens ?? 1000,
        }
      : {
          model: config.model,
          max_tokens: config.maxTokens ?? 1000,
          messages: [{ role: 'user', content: prompt }],
          temperature: config.temperature ?? 0.7,
        };

    const response = await this.fetchWithTimeout(proxyUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (config.provider === 'openrouter') {
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new AIError('AI 返回了空响应', 'invalid_response');
      }
      return this.parseResponse(content);
    } else {
      const content = data.content?.[0]?.text;
      if (!content) {
        throw new AIError('AI 返回了空响应', 'invalid_response');
      }
      return this.parseResponse(content);
    }
  }

  private async callOpenAI(config: AIProviderConfig, prompt: string): Promise<AIMetadataResponse> {
    const url = 'https://api.openai.com/v1/chat/completions';
    const proxyUrl = this.getProxyUrl(url);

    const response = await this.fetchWithTimeout(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: config.temperature ?? 0.7,
        max_tokens: config.maxTokens ?? 1000,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new AIError('AI 返回了空响应', 'invalid_response');
    }

    return this.parseResponse(content);
  }

  private async callCustom(config: AIProviderConfig, prompt: string): Promise<AIMetadataResponse> {
    if (!config.customEndpoint) {
      throw new AIError('未配置自定义 API 端点', 'auth');
    }

    // 构建完整的 API URL
    // 如果用户填写的是 base_url（如 https://ark.cn-beijing.volces.com/api/v3），
    // 需要拼接 chat/completions 端点
    let fullUrl = config.customEndpoint;
    if (!fullUrl.endsWith('/chat/completions')) {
      // 检查是否已包含 /api/v3 或类似路径
      if (fullUrl.endsWith('/api/v3') || fullUrl.endsWith('/v3') || fullUrl.endsWith('/v3/')) {
        fullUrl = fullUrl.replace(/\/$/, '') + '/chat/completions';
      } else {
        fullUrl = fullUrl.replace(/\/$/, '') + '/chat/completions';
      }
    }

    const proxyUrl = this.getProxyUrl(fullUrl);
    console.log('[AI Service] Original endpoint:', config.customEndpoint);
    console.log('[AI Service] Full URL:', fullUrl);
    console.log('[AI Service] Proxy URL:', proxyUrl);

    const response = await this.fetchWithTimeout(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: config.temperature ?? 0.7,
        max_tokens: config.maxTokens ?? 1000,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new AIError('AI 返回了空响应', 'invalid_response');
    }

    return this.parseResponse(content);
  }

  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

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
          throw new AIError('API Key 无效或已过期', 'auth', { statusCode: response.status, errorText });
        }
        if (response.status === 429) {
          throw new AIError('API 请求频率超限，请稍后重试', 'rate_limit');
        }
        if (response.status === 404) {
          throw new AIError('API 端点不存在，请检查自定义 API 端点配置', 'network', {
            statusCode: response.status,
            hint: '火山引擎端点应为: https://ark.cn-beijing.volces.com/v3/chat/completions',
            errorText,
          });
        }
        throw new AIError(`API 请求失败: ${response.status} ${response.statusText}`, 'network', {
          statusCode: response.status,
          errorText,
        });
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new AIError('请求超时，请检查网络连接', 'timeout');
        }
        if (error instanceof TypeError) {
          throw new AIError('网络连接失败，请检查网络设置', 'network', { originalError: error });
        }
      }
      throw error;
    }
  }

  private parseResponse(response: string): AIMetadataResponse {
    try {
      let cleaned = response.trim();

      // Remove markdown code block markers
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.slice(7);
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.slice(3);
      }
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.slice(0, -3);
      }
      cleaned = cleaned.trim();

      const data = JSON.parse(cleaned);

      // Validate required fields
      if (!data.name || typeof data.name !== 'string') {
        data.name = '未命名脚本';
      }
      if (!data.description || typeof data.description !== 'string') {
        data.description = '脚本描述';
      }
      if (!data.category || typeof data.category !== 'string') {
        data.category = '未分类';
      }
      if (!Array.isArray(data.tags)) {
        data.tags = [];
      }

      return data as AIMetadataResponse;
    } catch (error) {
      throw new AIError('无法解析 AI 返回的数据', 'invalid_response', {
        originalError: error,
        response: response.slice(0, 200) + '...',
      });
    }
  }

  /**
   * 测试 API 连接
   */
  async testConnection(config: AIProviderConfig): Promise<boolean> {
    try {
      await this.generateMetadata('@echo test', 'bat', config);
      return true;
    } catch (error) {
      if (error instanceof AIError) {
        throw error;
      }
      throw new AIError('测试连接失败', 'network', { originalError: error });
    }
  }
}

export const aiService = new AIService();
