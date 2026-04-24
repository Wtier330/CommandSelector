/**
 * AI 提示词构建器
 */

export type ScriptType = 'bat' | 'ps1' | 'vbs' | 'sh' | 'py';

/**
 * 构建脚本元数据生成提示词
 */
export function buildMetadataPrompt(
  scriptContent: string,
  scriptType: ScriptType
): string {
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

  return `${scriptTypeName}脚本生成元数据JSON：
{"name":"名称","shortDescription":"简短描述(<30字)","description":"详细描述(50-100字)","category":"分类","tags":["标签1","标签2"],"requires":"权限","platform":"${defaultPlatform}","version":"1.0.0","usage":"使用说明","params":[{"name":"参数","desc":"说明"}],"examples":["示例"],"notes":"备注"}

脚本：
\`\`\`${scriptType}
${scriptContent}
\`\`\``;
}

/**
 * 构建命令元数据补全提示词
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

export function buildCommandCompletionPrompt(command: CommandInfo): string {
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