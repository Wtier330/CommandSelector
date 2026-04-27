export type CommandEngine = "cmd" | "cmd+powershell";

export type ExecMode = "cmd" | "powershell" | "cmd2powershell";

export type ParamType = "text" | "path" | "number" | "enum" | "boolean";

export type ParamValidation =
  | {
      kind: "suffix";
      allowed: string[];
    }
  | {
      kind: "regex";
      pattern: string;
      flags?: string;
    };

export interface ParamDefinitionBase {
  key: string;
  label: string;
  type: ParamType;
  required?: boolean;
  defaultValue?: string | number | boolean;
  hint?: string;
  validation?: ParamValidation;
}

export interface EnumParamDefinition extends ParamDefinitionBase {
  type: "enum";
  options: Array<{ label: string; value: string }>;
  defaultValue?: string;
}

export type ParamDefinition = ParamDefinitionBase | EnumParamDefinition;

export interface CommandEntry {
  id: string;
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  engine?: CommandEngine;
  template: string;
  powershellTemplate?: string;
  params: ParamDefinition[];
  platform?: "windows" | "macos" | "linux" | "any";
  usage?: string;
  updatedAt?: string;
}

export interface LibraryMeta {
  schemaVersion: number;
  generatedAt?: string;
  source?: string;
}

export interface Library {
  meta: LibraryMeta;
  commands: CommandEntry[];
}

// 脚本类型
export type ScriptType = "bat" | "ps1" | "vbs" | "sh" | "cmd" | "py";

// 脚本文件元数据
export interface ScriptFileMeta {
  id: string;
  name: string;
  type: ScriptType;
  path: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  description?: string;
  // 解析的元数据（从注释中提取）
  metadata?: ParsedScriptMetadata;
  // 同步状态
  syncStatus?: 'synced' | 'modified' | 'file-missing';
  // 来源信息（用于脚本可追溯性）
  sourcePath?: string;      // 原始文件的完整路径
  sourceDir?: string;       // 来源目录（便于筛选和分组）
}

// 脚本注释元数据类型
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
}

// 脚本库
export interface ScriptLibrary {
  meta: LibraryMeta;
  scripts: ScriptFileMeta[];
}
