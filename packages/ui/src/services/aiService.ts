/**
 * AI 服务模块
 * 统一入口，整合所有 AI 调用功能
 */

import type { AIProviderConfig } from '../utils/aiConfig';
import type { ScriptType } from './aiPromptBuilder';
import type { AIMetadataResponse, CommandCompletionResponse } from './aiTypes';
import { AIError } from './aiTypes';

// 导出所有类型和错误类
export type { AIMetadataResponse, CommandCompletionResponse } from './aiTypes';
export { AIError, AI_CONSTANTS } from './aiTypes';

// 导出提示词构建器
export type { ScriptType } from './aiPromptBuilder';
export { buildMetadataPrompt, buildCommandCompletionPrompt, type CommandInfo as CommandPromptInfo } from './aiPromptBuilder';

// 导出解析器
export { parseMetadataResponse, parseCommandResponse, formatCommandResponse } from './aiParsers';

// 导出流式调用
export type { CommandInfo } from './aiStreamCalls';
export {
  completeCommandMetadataStream,
  streamAnthropicCommand,
  streamOpenAICommand,
  streamCustomCommand,
  testConnection as testAIConnection
} from './aiStreamCalls';

/**
 * AI 服务主类
 */
class AIService {
  /**
   * 生成脚本元数据
   */
  async generateMetadata(
    scriptContent: string,
    scriptType: ScriptType,
    config: AIProviderConfig
  ): Promise<AIMetadataResponse> {
    // 验证配置
    if (!config.apiKey || config.apiKey.length === 0) {
      throw new AIError('API Key 未配置', 'auth');
    }

    // 构建提示词
    const { buildMetadataPrompt } = await import('./aiPromptBuilder');
    const prompt = buildMetadataPrompt(scriptContent, scriptType);

    // 调用提供商
    const { generateMetadata: callProvider } = await import('./aiProviderCalls');
    return await callProvider(config, prompt);
  }

  /**
   * 补全命令元数据
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

    const { buildCommandCompletionPrompt } = await import('./aiPromptBuilder');
    const prompt = buildCommandCompletionPrompt(command);

    // 调用提供商
    const { completeCommandMetadata } = await import('./aiProviderCalls');
    return await completeCommandMetadata(config, prompt);
  }

  /**
   * 流式补全命令元数据
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
    const { completeCommandMetadataStream } = await import('./aiStreamCalls');
    return await completeCommandMetadataStream(command, config, onChunk, onStage);
  }

  /**
   * 测试连接
   */
  async testConnection(config: AIProviderConfig): Promise<boolean> {
    const { testConnection: testAIConnection } = await import('./aiStreamCalls');
    return await testAIConnection(config);
  }
}

export const aiService = new AIService();