/**
 * AI 响应解析器
 */

import type { AIMetadataResponse, CommandCompletionResponse } from './aiTypes';
import { AIError } from './aiTypes';

/**
 * 解析元数据 JSON 响应
 */
export function parseMetadataResponse(response: string): AIMetadataResponse {
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

    // 检查 JSON 是否可能不完整（以逗号结尾或缺少闭合括号）
    if (cleaned.endsWith(',')) {
      throw new Error('AI 返回的 JSON 不完整，可能是 max_tokens 设置过小导致内容被截断');
    }

    let braceCount = 0;
    for (const char of cleaned) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
    }
    if (braceCount !== 0) {
      throw new Error('AI 返回的 JSON 括号不匹配，内容被截断。建议在设置中增加 max_tokens 值');
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
    throw createAIError('无法解析 AI 返回的数据', 'invalid_response', {
      originalError: error,
      response: response.slice(0, 200) + '...',
    });
  }
}

/**
 * 解析命令元数据补全响应（纯文本格式）
 */
export function parseCommandResponse(response: string): CommandCompletionResponse {
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
    throw createAIError('无法解析 AI 返回的数据', 'invalid_response', {
      originalError: error,
      response: response.slice(0, 200) + '...',
    });
  }
}

/**
 * 格式化命令响应为文本
 */
export function formatCommandResponse(response: CommandCompletionResponse): string {
  const parts: string[] = [];
  if (response.description) parts.push(`描述: ${response.description}`);
  if (response.category) parts.push(`分类: ${response.category}`);
  if (response.tags?.length) parts.push(`标签: ${response.tags.join(', ')}`);
  if (response.usage) parts.push(`使用说明: ${response.usage}`);
  return parts.join('\n');
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