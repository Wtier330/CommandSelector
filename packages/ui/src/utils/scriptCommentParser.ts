export interface ParsedScriptMetadata {
  name: string;
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
    const multiLineMatch = content.match(/\/\*\s*[\s\S]*?\n([\s\S\s]*?)\n\s*\*\//);
    if (multiLineMatch) {
      return multiLineMatch[1] || '';
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

  // 验证并填充默认值
  private validateAndFillDefaults(metadata: ParsedScriptMetadata): ParsedScriptMetadata {
    if (!metadata.name || metadata.name.trim() === '') {
      throw new Error('脚本注释缺少 @name 或 .SYNOPSIS 字段');
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
