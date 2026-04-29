/**
 * AI 提示词模板配置管理
 * 支持用户自定义提示词模板，使用 {{ 变量 }} 插值
 */

import { invoke } from '@tauri-apps/api/core';

/**
 * 提示词模板配置
 */
export interface AIPromptTemplates {
  /** 脚本元数据生成提示词模板，null 表示使用默认 */
  metadataPrompt: string | null;
  /** 命令补全提示词模板，null 表示使用默认 */
  commandPrompt: string | null;
}

/**
 * 默认元数据生成提示词
 * 可用变量: {{scriptType}}, {{platform}}, {{scriptContent}}
 */
export const DEFAULT_METADATA_PROMPT = `{{scriptType}}脚本生成元数据JSON：
{"name":"名称","shortDescription":"简短描述(<30字)","description":"详细描述(50-100字)","category":"分类","tags":["标签1","标签2"],"requires":"权限","platform":"{{platform}}","version":"1.0.0","usage":"使用说明","params":[{"name":"参数","desc":"说明"}],"examples":["示例"],"notes":"备注"}

脚本：
\`\`\`{{scriptTypeKey}}
{{scriptContent}}
\`\`\``;

/**
 * 默认命令补全提示词
 * 可用变量: {{scriptType}}, {{knownFields}}
 */
export const DEFAULT_COMMAND_PROMPT = `{{scriptType}}命令补全元数据。
已有: {{knownFields}}
返回格式（纯文本，无JSON无markdown）：
描述: <20-50字>
分类: <系统管理/文件操作/网络/进程/开发等>
标签: <3个标签>
使用说明: <注意事项>`;

/**
 * 元数据模板可用变量说明
 */
export const METADATA_TEMPLATE_VARIABLES = [
  { key: '{{scriptType}}', desc: '脚本类型名称，如 BAT、PowerShell' },
  { key: '{{scriptTypeKey}}', desc: '脚本类型键名，如 bat、ps1' },
  { key: '{{platform}}', desc: '默认平台，如 Windows、Linux/Mac' },
  { key: '{{scriptContent}}', desc: '脚本文件内容' },
] as const;

/**
 * 命令补全模板可用变量说明
 */
export const COMMAND_TEMPLATE_VARIABLES = [
  { key: '{{scriptType}}', desc: '命令类型，如 CMD、PowerShell' },
  { key: '{{knownFields}}', desc: '已有信息，如 "名称: xxx | 描述: xxx"' },
] as const;

class PromptConfigManager {
  private cached: AIPromptTemplates | null = null;

  async getTemplates(): Promise<AIPromptTemplates> {
    if (this.cached) return this.cached;

    try {
      const templates = await invoke<AIPromptTemplates>('load_ai_prompts');
      this.cached = {
        metadataPrompt: templates.metadataPrompt || null,
        commandPrompt: templates.commandPrompt || null,
      };
      return this.cached;
    } catch (error) {
      console.error('Failed to load AI prompts:', error);
      return { metadataPrompt: null, commandPrompt: null };
    }
  }

  async saveTemplates(templates: AIPromptTemplates): Promise<void> {
    try {
      await invoke('save_ai_prompts', { prompts: templates });
      this.cached = templates;
    } catch (error) {
      console.error('Failed to save AI prompts:', error);
      throw new Error('保存提示词配置失败');
    }
  }

  /** 获取元数据提示词（自定义 or 默认） */
  async getMetadataPrompt(): Promise<string> {
    const templates = await this.getTemplates();
    return templates.metadataPrompt || DEFAULT_METADATA_PROMPT;
  }

  /** 获取命令补全提示词（自定义 or 默认） */
  async getCommandPrompt(): Promise<string> {
    const templates = await this.getTemplates();
    return templates.commandPrompt || DEFAULT_COMMAND_PROMPT;
  }

  /** 恢复所有提示词为默认 */
  async resetToDefault(): Promise<void> {
    await this.saveTemplates({ metadataPrompt: null, commandPrompt: null });
  }

  /** 清除缓存 */
  clearCache(): void {
    this.cached = null;
  }
}

export const promptConfigManager = new PromptConfigManager();
