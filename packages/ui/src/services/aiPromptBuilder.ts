/**
 * AI 提示词构建器
 * 支持用户自定义模板，使用 {{ 变量 }} 插值
 */

import { promptConfigManager } from '../utils/promptConfig';

export type ScriptType = 'bat' | 'ps1' | 'vbs' | 'sh' | 'py';

/**
 * 模板变量替换
 */
function applyTemplate(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(pattern, value);
  }
  return result;
}

/**
 * 构建脚本元数据生成提示词
 * 可用模板变量: scriptType, scriptTypeKey, platform, scriptContent
 */
export async function buildMetadataPrompt(
  scriptContent: string,
  scriptType: ScriptType
): Promise<string> {
  const scriptTypeNames: Record<string, string> = {
    bat: 'BAT',
    ps1: 'PowerShell',
    vbs: 'VBScript',
    sh: 'Shell (Bash)',
    py: 'Python'
  };
  const scriptTypeName = scriptTypeNames[scriptType] || scriptType;

  const platforms: Record<string, string> = {
    bat: 'Windows',
    ps1: 'Windows',
    vbs: 'Windows',
    sh: 'Linux/Mac',
    py: 'Any'
  };
  const defaultPlatform = platforms[scriptType] || 'Any';

  const template = await promptConfigManager.getMetadataPrompt();

  return applyTemplate(template, {
    scriptType: scriptTypeName,
    scriptTypeKey: scriptType,
    platform: defaultPlatform,
    scriptContent,
  });
}

/**
 * 构建命令元数据补全提示词
 * 可用模板变量: scriptType, knownFields
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

export async function buildCommandCompletionPrompt(command: CommandInfo): Promise<string> {
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
  const knownFieldsStr = knownFields.length > 0 ? knownFields.join(' | ') : '暂无';

  const tmpl = await promptConfigManager.getCommandPrompt();

  return applyTemplate(tmpl, {
    scriptType: scriptTypeHint,
    knownFields: knownFieldsStr,
  });
}

/**
 * 同步版本（用于不需要自定义模板的场景，如测试）
 * 使用默认硬编码模板
 */
export { DEFAULT_METADATA_PROMPT, DEFAULT_COMMAND_PROMPT } from '../utils/promptConfig';
