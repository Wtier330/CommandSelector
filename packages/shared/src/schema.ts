export type CommandEngine = "cmd" | "cmd+powershell";

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
