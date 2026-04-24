import { computed, type Ref } from "vue";
import {
  parseBatComment,
  parsePs1Comment,
  parseVbsComment,
  parseShellComment,
  parsePythonComment,
  type ParsedScriptMetadata
} from "../utils/scriptCommentParser";
import type { ScriptType } from "@commandselector/shared";

export interface MetadataStatus {
  isValid: boolean;
  message: string;
  fields: {
    name: boolean;
    shortDescription: boolean;
    description: boolean;
    category: boolean;
    tags: boolean;
    usage: boolean;
  };
}

/**
 * 脚本元数据解析和验证
 * @param scriptContent - 脚本内容
 * @param scriptType - 脚本类型
 * @returns 元数据和验证状态
 */
export function useScriptMetadata(
  scriptContent: Ref<string>,
  scriptType: Ref<ScriptType>
) {
  // 解析元数据
  const metadata = computed<ParsedScriptMetadata | null>(() => {
    if (!scriptContent.value) return null;

    try {
      switch (scriptType.value) {
        case "bat":
        case "cmd":
          return parseBatComment(scriptContent.value);
        case "ps1":
          return parsePs1Comment(scriptContent.value);
        case "vbs":
          return parseVbsComment(scriptContent.value);
        case "sh":
          return parseShellComment(scriptContent.value);
        case "py":
          return parsePythonComment(scriptContent.value);
        default:
          return parseBatComment(scriptContent.value);
      }
    } catch {
      return null;
    }
  });

  // 元数据验证状态
  const metadataStatus = computed<MetadataStatus>(() => {
    const meta = metadata.value;

    if (!meta) {
      return {
        isValid: false,
        message: "无法解析",
        fields: {
          name: false,
          shortDescription: false,
          description: false,
          category: false,
          tags: false,
          usage: false,
        }
      };
    }

    const hasRequired = !meta.name || !meta.description || !meta.category;

    return {
      isValid: !hasRequired,
      message: hasRequired ? "缺少必填字段" : "注释完整",
      fields: {
        name: !!meta.name,
        shortDescription: !!meta.shortDescription,
        description: !!meta.description,
        category: !!meta.category,
        tags: meta.tags?.length > 0,
        usage: !!meta.usage,
      }
    };
  });

  return {
    metadata,
    metadataStatus
  };
}
