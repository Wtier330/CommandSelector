/**
 * AI 服务调用模块
 * 处理 AI API 调用、超时、重试、错误处理
 */

import type { AIProviderConfig } from '../utils/aiConfig';

export interface AIMetadataResponse {
  name: string;
  shortDescription?: string;  // 简短描述，用于卡片显示
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

/**
 * 命令补全响应接口
 */
export interface CommandCompletionResponse {
  description: string;
  category: string;
  tags: string[];
  usage: string;
  shortDescription?: string;
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
  private readonly DEFAULT_MAX_TOKENS = 300; // 减少默认 token 数，加快响应

  // 检测是否为开发环境
  private isDevEnv(): boolean {
    return typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    );
  }

  // 获取代理 URL（开发环境走 Vite 代理，避免 CORS 问题）
  private getProxyUrl(originalUrl: string): string {
    // 国内 API 直接访问，不需要代理
    if (originalUrl.includes('volces.com')) {
      return originalUrl;
    }

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

  /**
   * 补全命令元数据
   * 基于已有信息补全缺失字段
   */
  async completeCommandMetadata(
    command: {
      name?: string;
      description?: string;
      category?: string;
      tags?: string[];
      template?: string;
      powershellTemplate?: string;
      usage?: string;
      platform?: string;
    },
    config: AIProviderConfig
  ): Promise<CommandCompletionResponse> {
    // 验证配置
    if (!config.apiKey || config.apiKey.length === 0) {
      throw new AIError('API Key 未配置', 'auth');
    }

    const prompt = this.buildCommandCompletionPrompt(command);

    // 根据提供商调用对应的 API
    switch (config.provider) {
      case 'anthropic':
      case 'openrouter':
        return await this.callAnthropicCommand(config, prompt);
      case 'openai':
        return await this.callOpenAICommand(config, prompt);
      case 'custom':
        return await this.callCustomCommand(config, prompt);
      default:
        throw new AIError(`不支持的 AI 服务提供商: ${config.provider}`, 'auth');
    }
  }

  private buildCommandCompletionPrompt(command: {
    name?: string;
    description?: string;
    category?: string;
    tags?: string[];
    template?: string;
    powershellTemplate?: string;
    usage?: string;
    platform?: string;
  }): string {
    // 判断模板类型
    const hasPowerShell = command.powershellTemplate?.trim();
    const hasCmd = command.template?.trim();
    const isPowerShellType = hasPowerShell && !hasCmd;

    // 收集已有信息
    const knownFields: string[] = [];
    if (command.name) knownFields.push(`名称: ${command.name}`);
    if (command.description) knownFields.push(`描述: ${command.description}`);
    if (command.category) knownFields.push(`分类: ${command.category}`);
    if (command.tags?.length) knownFields.push(`标签: ${command.tags.join(', ')}`);
    if (command.template) knownFields.push(`CMD: ${command.template.slice(0, 50)}${command.template.length > 50 ? '...' : ''}`);
    if (command.powershellTemplate) knownFields.push(`PS: ${command.powershellTemplate.slice(0, 50)}${command.powershellTemplate.length > 50 ? '...' : ''}`);

    const scriptTypeHint = isPowerShellType ? 'PowerShell' : 'CMD';

    return `${scriptTypeHint}命令补全元数据。
已有: ${knownFields.length > 0 ? knownFields.join(' | ') : '暂无'}
返回格式（纯文本，无JSON无markdown）：
描述: <20-50字>
分类: <系统管理/文件操作/网络/进程/开发等>
标签: <3个标签>
使用说明: <注意事项>`;
  }

  private buildPrompt(scriptContent: string, scriptType: 'bat' | 'ps1'): string {
    const scriptTypeName = scriptType === 'bat' ? 'BAT' : 'PowerShell';
    return `${scriptTypeName}脚本生成元数据JSON：
{"name":"名称","shortDescription":"简短描述(<30字)","description":"详细描述(50-100字)","category":"分类","tags":["标签1","标签2"],"requires":"权限","platform":"Windows","version":"1.0.0","usage":"使用说明","params":[{"name":"参数","desc":"说明"}],"examples":["示例"],"notes":"备注"}

脚本：
\`\`\`${scriptType}
${scriptContent}
\`\`\``;
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
          max_tokens: config.maxTokens ?? this.DEFAULT_MAX_TOKENS,
        }
      : {
          model: config.model,
          max_tokens: config.maxTokens ?? this.DEFAULT_MAX_TOKENS,
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
        max_tokens: config.maxTokens ?? this.DEFAULT_MAX_TOKENS,
      }),
    });

    let data;
    try {
      data = await response.json();
      console.log('[AI Service] Response data:', JSON.stringify(data).slice(0, 500));
    } catch (e) {
      const text = await response.text().catch(() => '无法读取响应体');
      console.error('[AI Service] JSON parse error:', e, 'Response text:', text.slice(0, 500));
      throw new AIError('响应格式错误', 'invalid_response', { error: String(e), responseText: text.slice(0, 500) });
    }

    const content = data.choices?.[0]?.message?.content;
    console.log('[AI Service] Content:', content?.slice(0, 200));

    if (!content) {
      console.error('[AI Service] Empty content, data:', data);
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
        max_tokens: config.maxTokens ?? this.DEFAULT_MAX_TOKENS,
      }),
    });

    let data;
    try {
      data = await response.json();
      console.log('[AI Service] Response data:', JSON.stringify(data).slice(0, 500));
    } catch (e) {
      const text = await response.text().catch(() => '无法读取响应体');
      console.error('[AI Service] JSON parse error:', e, 'Response text:', text.slice(0, 500));
      throw new AIError('响应格式错误', 'invalid_response', { error: String(e), responseText: text.slice(0, 500) });
    }

    const content = data.choices?.[0]?.message?.content;
    console.log('[AI Service] Content:', content?.slice(0, 200));

    if (!content) {
      console.error('[AI Service] Empty content, data:', data);
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

      // 尝试从 Markdown 代码块中提取 JSON
      // 匹配 ```json ... ``` 格式
      const jsonBlockMatch = cleaned.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonBlockMatch) {
        cleaned = jsonBlockMatch[1].trim();
      } else {
        // 如果没有 json 代码块，尝试普通代码块
        const codeBlockMatch = cleaned.match(/```\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
          cleaned = codeBlockMatch[1].trim();
        } else {
          // 尝试直接解析（可能是纯 JSON）
          // 去掉可能的前缀文字
          const firstBrace = cleaned.indexOf('{');
          const lastBrace = cleaned.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            cleaned = cleaned.slice(firstBrace, lastBrace + 1);
          }
        }
      }

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

  private async callAnthropicCommand(config: AIProviderConfig, prompt: string): Promise<CommandCompletionResponse> {
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
          max_tokens: config.maxTokens ?? this.DEFAULT_MAX_TOKENS,
        }
      : {
          model: config.model,
          max_tokens: config.maxTokens ?? this.DEFAULT_MAX_TOKENS,
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
      return this.parseCommandResponse(content);
    } else {
      const content = data.content?.[0]?.text;
      if (!content) {
        throw new AIError('AI 返回了空响应', 'invalid_response');
      }
      return this.parseCommandResponse(content);
    }
  }

  private async callOpenAICommand(config: AIProviderConfig, prompt: string): Promise<CommandCompletionResponse> {
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
        max_tokens: config.maxTokens ?? this.DEFAULT_MAX_TOKENS,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new AIError('AI 返回了空响应', 'invalid_response');
    }

    return this.parseCommandResponse(content);
  }

  private async callCustomCommand(config: AIProviderConfig, prompt: string): Promise<CommandCompletionResponse> {
    if (!config.customEndpoint) {
      throw new AIError('未配置自定义 API 端点', 'auth');
    }

    let fullUrl = config.customEndpoint;
    if (!fullUrl.endsWith('/chat/completions')) {
      if (fullUrl.endsWith('/api/v3') || fullUrl.endsWith('/v3') || fullUrl.endsWith('/v3/')) {
        fullUrl = fullUrl.replace(/\/$/, '') + '/chat/completions';
      } else {
        fullUrl = fullUrl.replace(/\/$/, '') + '/chat/completions';
      }
    }

    const proxyUrl = this.getProxyUrl(fullUrl);

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
        max_tokens: config.maxTokens ?? this.DEFAULT_MAX_TOKENS,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new AIError('AI 返回了空响应', 'invalid_response');
    }

    return this.parseCommandResponse(content);
  }

  private parseCommandResponse(response: string): CommandCompletionResponse {
    try {
      let cleaned = response.trim();

      // Remove markdown code block markers
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.slice(3);
      }
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.slice(0, -3);
      }
      cleaned = cleaned.trim();

      // 解析纯文本格式
      // 格式: 描述: xxx\n分类: xxx\n标签: xxx,xxx\n使用说明: xxx
      const result: CommandCompletionResponse = {
        description: '',
        category: '',
        tags: [],
        usage: '',
        shortDescription: undefined,
      };

      const lines = cleaned.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('描述:') || trimmed.startsWith('描述:')) {
          result.description = trimmed.slice(trimmed.indexOf(':') + 1).trim();
        } else if (trimmed.startsWith('分类:') || trimmed.startsWith('分类:')) {
          result.category = trimmed.slice(trimmed.indexOf(':') + 1).trim();
        } else if (trimmed.startsWith('标签:') || trimmed.startsWith('标签:')) {
          const tagsStr = trimmed.slice(trimmed.indexOf(':') + 1).trim();
          result.tags = tagsStr.split(/[,，]/).map(t => t.trim()).filter(t => t);
        } else if (trimmed.startsWith('使用说明:') || trimmed.startsWith('使用说明:')) {
          result.usage = trimmed.slice(trimmed.indexOf(':') + 1).trim();
        }
      }

      // 如果解析失败，提供友好的错误信息
      if (!result.description && !result.category && result.tags.length === 0) {
        throw new Error('无法从响应中提取有效信息');
      }

      return result;
    } catch (error) {
      throw new AIError('无法解析 AI 返回的数据', 'invalid_response', {
        originalError: error,
        response: response.slice(0, 200) + '...',
      });
    }
  }

  /**
   * 轻量级连接测试 - 只检查 API 是否可达，不等待 AI 生成
   */
  async testConnection(config: AIProviderConfig): Promise<boolean> {
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

      const proxyUrl = this.getProxyUrl(url);

      // 发送一个极简请求，只验证连通性
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

      const response = await fetch(proxyUrl, {
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

      if (!response.ok && response.status !== 400 && response.status !== 401 && response.status !== 404) {
        // 400/401/404 说明API可达，只是参数问题
        throw new AIError(`API 响应错误: ${response.status}`, 'network');
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

  /**
   * 流式补全命令元数据
   * @param command 命令信息
   * @param config 提供商配置
   * @param onChunk 每收到一个文本块就回调
   * @param onStage 阶段变化回调（如 "分析中" -> "生成描述" -> "完成"）
   */
  async completeCommandMetadataStream(
    command: {
      name?: string;
      description?: string;
      category?: string;
      tags?: string[];
      template?: string;
      powershellTemplate?: string;
      usage?: string;
      platform?: string;
    },
    config: AIProviderConfig,
    onChunk: (text: string) => void,
    onStage?: (stage: string) => void
  ): Promise<CommandCompletionResponse> {
    console.log('[AI Service] stream start, provider:', config.provider, 'endpoint:', config.customEndpoint);

    if (!config.apiKey || config.apiKey.length === 0) {
      throw new AIError('API Key 未配置', 'auth');
    }

    const prompt = this.buildCommandCompletionPrompt(command);
    onStage?.('分析中');

    // 根据提供商调用对应的流式 API
    switch (config.provider) {
      case 'anthropic':
        return await this.streamAnthropicCommand(config, prompt, onChunk, onStage);
      case 'openrouter':
        return await this.streamOpenAICommand(config, prompt, onChunk, onStage);
      case 'openai':
        return await this.streamOpenAICommand(config, prompt, onChunk, onStage);
      case 'custom':
        return await this.streamCustomCommand(config, prompt, onChunk, onStage);
      default:
        throw new AIError(`不支持的 AI 服务提供商: ${config.provider}`, 'auth');
    }
  }

  private async streamAnthropicCommand(
    config: AIProviderConfig,
    prompt: string,
    onChunk: (text: string) => void,
    onStage?: (stage: string) => void
  ): Promise<CommandCompletionResponse> {
    // Anthropic 不支持流式 /messages API，使用标准调用
    onStage?.('生成中');
    const result = await this.callAnthropicCommand(config, prompt);
    // 模拟流式输出
    const text = this.formatCommandResponse(result);
    for (const char of text) {
      onChunk(char);
      await this.delay(15); // 模拟打字效果，每字符15ms
    }
    return result;
  }

  private async streamOpenAICommand(
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

    const proxyUrl = this.getProxyUrl(fullUrl);
    console.log('[AI Service] streamOpenAICommand, fullUrl:', fullUrl, 'proxyUrl:', proxyUrl);
    onStage?.('生成中');

    // 使用 AbortController 添加超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
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
          max_tokens: config.maxTokens ?? this.DEFAULT_MAX_TOKENS,
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
      return this.parseCommandResponse(fullContent);
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('[AI Service] Stream error:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AIError('请求超时，请检查网络连接', 'timeout');
      }
      throw error;
    }
  }

  private async streamCustomCommand(
    config: AIProviderConfig,
    prompt: string,
    onChunk: (text: string) => void,
    onStage?: (stage: string) => void
  ): Promise<CommandCompletionResponse> {
    console.log('[AI Service] streamCustomCommand called, endpoint:', config.customEndpoint);
    // 火山引擎直连非流式更快
    onStage?.('生成中');
    const result = await this.callCustomCommand(config, prompt);
    // 模拟流式输出
    const text = this.formatCommandResponse(result);
    for (const char of text) {
      onChunk(char);
      await this.delay(15);
    }
    return result;
  }

  private formatCommandResponse(response: CommandCompletionResponse): string {
    const parts: string[] = [];
    if (response.description) parts.push(`描述: ${response.description}`);
    if (response.category) parts.push(`分类: ${response.category}`);
    if (response.tags?.length) parts.push(`标签: ${response.tags.join(', ')}`);
    if (response.usage) parts.push(`使用说明: ${response.usage}`);
    return parts.join('\n');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const aiService = new AIService();
