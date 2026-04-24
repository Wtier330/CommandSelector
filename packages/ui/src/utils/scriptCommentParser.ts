export interface ParsedScriptMetadata {
  name: string;
  shortDescription?: string;  // 简短描述，用于卡片显示
  description: string;
  category: string;
  tags: string[];
  requires?: string;
  platform?: string;
  version?: string;
  author?: string;
  date?: string;
  usage?: string;
  params: { name: string; desc: string }[];
  examples: string[];
  notes?: string;
  rawComment?: string;
}

export class ScriptCommentParser {
  // 解析 BAT 文件注释
  parseBat(content: string): ParsedScriptMetadata | null {
    const commentBlock = this.extractBatCommentBlock(content);
    if (!commentBlock) return null;
    return this.parseCommentBlock(commentBlock, 'bat');
  }

  // 解析 PowerShell 文件注释
  parsePs1(content: string): ParsedScriptMetadata | null {
    const commentBlock = this.extractPs1CommentBlock(content);
    if (!commentBlock) return null;
    return this.parseCommentBlock(commentBlock, 'ps1');
  }

  // 通用注释块解析
  private parseCommentBlock(block: string, type: 'bat' | 'ps1'): ParsedScriptMetadata {
    const metadata: ParsedScriptMetadata = {
      name: '',
      description: '',
      category: '未分类',
      tags: [],
      params: [],
      examples: [],
      platform: type === 'ps1' ? 'Windows' : 'windows',
    };

    const lines = block.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine === '*/' || trimmedLine === '#>' || trimmedLine === '/*' || trimmedLine === '*') {
        continue;
      }

      if (type === 'bat') {
        // BAT 格式解析: @name description
        const match = trimmedLine.match(/^\s*\*\s*@(\w+)\s+(.*)/);
        if (match) {
          const [, key, value] = match;
          this.setMetadata(metadata, key, value);
        }
      } else if (type === 'ps1') {
        // PowerShell 格式解析: .KEY value
        const match = trimmedLine.match(/^\s*\.(\w+)\s+(.*)/);
        if (match) {
          const [, key, value] = match;
          this.setMetadata(metadata, key, value);
        }
      }
    }

    return this.validateAndFillDefaults(metadata);
  }

  // 提取 BAT 注释块
  private extractBatCommentBlock(content: string): string | null {
    // 查找 /* ... */ 风格
    // 匹配从 /* 开始到第一个 */ 结束的内容
    const multiLineMatch = content.match(/\/\*[\s\S]*?\*\//);
    if (multiLineMatch) {
      // 去掉首尾的 /* 和 */
      const block = multiLineMatch[0];
      return block.slice(2, -2).trim();
    }

    // 查找单行注释
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('/**') || line.startsWith('/*')) {
        const commentLines: string[] = [];
        commentLines.push(line);

        // 收集直到 */ 的所有行
        for (let j = i + 1; j < lines.length; j++) {
          commentLines.push(lines[j]);
          if (lines[j].trim().endsWith('*/')) {
            break;
          }
        }

        return commentLines.join('\n');
      }
    }

    return null;
  }

  // 提取 PowerShell 注释块
  private extractPs1CommentBlock(content: string): string | null {
    const match = content.match(/<#\s*([\s\S\s]*?)\s*#>/);
    if (match) {
      return match[1] || '';
    }

    return null;
  }

  // 设置元数据
  private setMetadata(metadata: ParsedScriptMetadata, key: string, value: string) {
    const normalizedKey = key.toLowerCase().replace(/-/g, '');

    switch (normalizedKey) {
      case 'name':
      case 'synopsis':
        metadata.name = value.trim();
        break;
      case 'shortdescription':
      case 'short':
        metadata.shortDescription = value.trim();
        break;
      case 'description':
        metadata.description = value.trim();
        break;
      case 'category':
        metadata.category = value.trim();
        break;
      case 'tags':
        metadata.tags = value.split(',').map(t => t.trim()).filter(Boolean);
        break;
      case 'requires':
        metadata.requires = value.trim();
        break;
      case 'platform':
        metadata.platform = value.trim();
        break;
      case 'version':
        metadata.version = value.trim();
        break;
      case 'author':
        metadata.author = value.trim();
        break;
      case 'date':
        metadata.date = value.trim();
        break;
      case 'usage':
        metadata.usage = value.trim();
        break;
      case 'param':
      case 'parameter':
        const paramMatch = value.match(/^(\w+)\s+(.*)/);
        if (paramMatch) {
          metadata.params.push({
            name: paramMatch[1].trim(),
            desc: paramMatch[2].trim()
          });
        }
        break;
      case 'example':
        metadata.examples.push(value.trim());
        break;
      case 'notes':
        metadata.notes = value.trim();
        break;
    }
  }

  // 验证并填充默认值（宽松模式）
  private validateAndFillDefaults(metadata: ParsedScriptMetadata): ParsedScriptMetadata {
    if (!metadata.name || metadata.name.trim() === '') {
      metadata.name = '未命名脚本';
    }
    if (!metadata.category || metadata.category.trim() === '') {
      metadata.category = '未分类';
    }

    return metadata;
  }

  // 生成 BAT 注释模板
  static getBatCommentTemplate(): string {
    return `/**
 * @name
 * @shortDescription
 * @description
 * @category
 * @tags
 * @requires
 * @platform windows
 * @version 1.0.0
 * @author
 * @date ${new Date().toISOString().split('T')[0]}
 *
 * @usage
 *
 * @example
 *
 */`;
  }

  // 生成 PowerShell 注释模板
  static getPs1CommentTemplate(): string {
    return `<#
.SYNOPSIS

.SHORTDESCRIPTION

.DESCRIPTION

.CATEGORY

.TAGS

.REQUIRES

.PLATFORM
    Windows

.VERSION
    1.0.0

.AUTHOR

.DATE
    ${new Date().toISOString().split('T')[0]}

.USAGE

.EXAMPLE

.NOTES
#>`;
  }
}

// 导出便捷函数
export function parseBatComment(content: string): ParsedScriptMetadata | null {
  return new ScriptCommentParser().parseBat(content);
}

export function parsePs1Comment(content: string): ParsedScriptMetadata | null {
  return new ScriptCommentParser().parsePs1(content);
}

// 解析 VBS 注释
export function parseVbsComment(content: string): ParsedScriptMetadata | null {
  const commentBlock = extractVbsCommentBlock(content);
  if (!commentBlock) return null;
  return parseVbsCommentBlock(commentBlock);
}

// 解析 Shell 注释
export function parseShellComment(content: string): ParsedScriptMetadata | null {
  const commentBlock = extractShellCommentBlock(content);
  if (!commentBlock) return null;
  return parseShellCommentBlock(commentBlock);
}

// 解析 Python 注释
export function parsePythonComment(content: string): ParsedScriptMetadata | null {
  const commentBlock = extractPythonCommentBlock(content);
  if (!commentBlock) return null;
  return parsePythonCommentBlock(commentBlock);
}

// ============ VBS 解析器 ============

function extractVbsCommentBlock(content: string): string | null {
  const lines = content.split('\n');
  const commentLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // 查找以 REM 或 ' 开头的注释行
    if (trimmed.startsWith('REM') || trimmed.startsWith('rem')) {
      commentLines.push(trimmed);
    } else if (trimmed.startsWith("'")) {
      commentLines.push(trimmed);
    } else if (commentLines.length > 0) {
      // 如果已经开始收集注释，遇到非注释行则停止
      break;
    }
  }

  return commentLines.length > 0 ? commentLines.join('\n') : null;
}

function parseVbsCommentBlock(block: string): ParsedScriptMetadata | null {
  const metadata: ParsedScriptMetadata = {
    name: '',
    description: '',
    category: '未分类',
    tags: [],
    params: [],
    examples: [],
    platform: 'Windows',
  };

  const lines = block.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === 'REM' || trimmed === "'") continue;

    // 移除 REM 或 ' 前缀
    const content = trimmed
      .replace(/^REM\s*/i, '')
      .replace(/^'/, '')
      .replace(/^#? ?/, '');

    // 解析键值对: Key: Value
    const match = content.match(/^(\w+):\s*(.*)/);
    if (match) {
      const [, key, value] = match;
      setMetadata(metadata, key, value);
    }
  }

  return validateAndFillDefaults(metadata);
}

// ============ Shell 解析器 ============

function extractShellCommentBlock(content: string): string | null {
  const lines = content.split('\n');
  const commentLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) {
      commentLines.push(trimmed);
    } else if (commentLines.length > 0 && !trimmed.startsWith('#')) {
      break;
    }
  }

  return commentLines.length > 0 ? commentLines.join('\n') : null;
}

function parseShellCommentBlock(block: string): ParsedScriptMetadata | null {
  const metadata: ParsedScriptMetadata = {
    name: '',
    description: '',
    category: '未分类',
    tags: [],
    params: [],
    examples: [],
    platform: 'Linux/Mac',
  };

  const lines = block.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === '#') continue;

    // 移除 # 前缀
    const content = trimmed.replace(/^#+\s*/, '');

    // 解析键值对: Key: Value
    const match = content.match(/^(\w+):\s*(.*)/);
    if (match) {
      const [, key, value] = match;
      setMetadata(metadata, key, value);
    }
  }

  return validateAndFillDefaults(metadata);
}

// ============ Python 解析器 ============

function extractPythonCommentBlock(content: string): string | null {
  // 首先尝试匹配三引号注释块
  const docstringMatch = content.match(/"""[\s\S]*?"""/);
  if (docstringMatch) {
    return docstringMatch[0].slice(3, -3).trim();
  }

  // 其次尝试匹配单引号三引号注释块
  const singleQuoteMatch = content.match(/'''[\s\S]*?'''/);
  if (singleQuoteMatch) {
    return singleQuoteMatch[0].slice(3, -3).trim();
  }

  return null;
}

function parsePythonCommentBlock(block: string): ParsedScriptMetadata | null {
  const metadata: ParsedScriptMetadata = {
    name: '',
    description: '',
    category: '未分类',
    tags: [],
    params: [],
    examples: [],
    platform: 'Any',
  };

  const lines = block.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // 解析键值对: Key: Value
    const match = trimmed.match(/^(\w+):\s*(.*)/);
    if (match) {
      const [, key, value] = match;
      setMetadata(metadata, key, value);
    }
  }

  return validateAndFillDefaults(metadata);
}

// 通用设置元数据函数
function setMetadata(metadata: ParsedScriptMetadata, key: string, value: string) {
  const normalizedKey = key.toLowerCase().replace(/-/g, '');

  switch (normalizedKey) {
    case 'name':
    case 'scriptname':
      metadata.name = value.trim();
      break;
    case 'shortdescription':
    case 'short':
      metadata.shortDescription = value.trim();
      break;
    case 'description':
      metadata.description = value.trim();
      break;
    case 'category':
      metadata.category = value.trim();
      break;
    case 'tags':
      metadata.tags = value.split(',').map(t => t.trim()).filter(Boolean);
      break;
    case 'requires':
      metadata.requires = value.trim();
      break;
    case 'platform':
      metadata.platform = value.trim();
      break;
    case 'version':
      metadata.version = value.trim();
      break;
    case 'author':
      metadata.author = value.trim();
      break;
    case 'date':
      metadata.date = value.trim();
      break;
    case 'usage':
      metadata.usage = value.trim();
      break;
    case 'example':
      metadata.examples.push(value.trim());
      break;
    case 'notes':
      metadata.notes = value.trim();
      break;
  }
}

// 验证并填充默认值
function validateAndFillDefaults(metadata: ParsedScriptMetadata): ParsedScriptMetadata {
  if (!metadata.name || metadata.name.trim() === '') {
    metadata.name = '未命名脚本';
  }
  if (!metadata.category || metadata.category.trim() === '') {
    metadata.category = '未分类';
  }

  return metadata;
}
