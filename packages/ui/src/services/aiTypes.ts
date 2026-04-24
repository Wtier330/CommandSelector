/**
 * AI 服务类型定义
 */

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

/**
 * AI 错误类
 */
export class AIError extends Error {
  code: 'network' | 'timeout' | 'auth' | 'rate_limit' | 'invalid_response';
  details?: any;

  constructor(
    message: string,
    code: 'network' | 'timeout' | 'auth' | 'rate_limit' | 'invalid_response',
    details?: any
  ) {
    super(message);
    this.name = 'AIError';
    this.code = code;
    this.details = details;
  }
}

/**
 * AI 服务常量
 */
export const AI_CONSTANTS = {
  TIMEOUT: 30000,                    // 30 秒超时
  DEFAULT_MAX_TOKENS: 300,          // 通用默认 token 数
  METADATA_MAX_TOKENS: 600,         // 脚本元数据生成需要的 token 数
} as const;