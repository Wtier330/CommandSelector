import { ref } from "vue";
import type { ScriptFileMeta, ScriptLibrary, CommandEntry, ScriptType, ParsedScriptMetadata } from "@commandselector/shared";

// Tauri plugins
import { readTextFile, writeTextFile, BaseDirectory } from "@tauri-apps/plugin-fs";
import { open, save } from "@tauri-apps/plugin-dialog";
import { isTauri } from "@tauri-apps/api/core";
import { appLocalDataDir, join } from "@tauri-apps/api/path";
import { invoke } from "@tauri-apps/api/core";

// 日志
import { logger } from "../utils/logger";

// 导入注释解析器
import { parseBatComment, parsePs1Comment } from "@commandselector/ui";

const SCRIPTS_FILE = "scripts.json";
const SCRIPTS_DIR = "scripts";

// 解析脚本的元数据注释
function parseScriptMetadata(content: string, scriptType: ScriptType): ParsedScriptMetadata | null {
  try {
    if (scriptType === "bat") {
      return parseBatComment(content);
    } else if (scriptType === "ps1") {
      return parsePs1Comment(content);
    }
    return null;
  } catch (e) {
    console.error("Failed to parse script metadata:", e);
    return null;
  }
}

const scripts = ref<ScriptFileMeta[]>([]);
const isLoaded = ref(false);
const errorMsg = ref("");

async function ensureScriptsDir() {
  if (!isTauri()) return;
  // writeTextFile 会自动创建父目录，所以这里不需要额外操作
}

export async function loadScripts() {
  if (isLoaded.value) return;

  try {
    let data: ScriptFileMeta[] = [];

    if (isTauri()) {
      try {
    const fileContent = await readTextFile(SCRIPTS_FILE, {
          baseDir: BaseDirectory.AppLocalData
        });
        const library = JSON.parse(fileContent) as ScriptLibrary;
        data = library.scripts || [];
        logger.info('Scripts', 'Loaded scripts from file', { count: data.length });
      } catch (error) {
        // 文件不存在，初始化为空数组
        data = [];
        logger.info('Scripts', 'No scripts file found, starting fresh');
      }
    } else {
      try {
        const localData = localStorage.getItem("cs_scripts_data");
        if (localData) {
          const library = JSON.parse(localData) as ScriptLibrary;
          data = library.scripts || [];
        }
      } catch (error) {
        data = [];
      }
    }

    // 异步解析所有脚本的元数据
    const parsedScripts = await Promise.all(data.map(async (script) => {
      try {
        const content = await getScriptContentById(script.id, script.path);
        const metadata = parseScriptMetadata(content, script.type);
        if (metadata) {
          return { ...script, metadata };
        }
        return script;
      } catch (e) {
        console.error("Failed to parse metadata for script:", script.name, e);
        logger.warn('Scripts', 'Failed to parse metadata', { script: script.name, error: String(e) });
        return script;
      }
    }));

    scripts.value = parsedScripts || [];
    isLoaded.value = true;
  } catch (e: any) {
    console.error("Failed to load scripts:", e);
    errorMsg.value = e.message || "加载脚本失败";
    scripts.value = [];
    isLoaded.value = true;
  }
}

// 获取脚本内容（内部函数，不导出）
async function getScriptContentById(id: string, path: string): Promise<string> {
  try {
    if (isTauri()) {
      return await invoke("read_script_file", { path });
    } else {
      const content = localStorage.getItem(`cs_script_${id}`);
      return content ?? "";
    }
  } catch (e: any) {
    console.error("Failed to read script content:", e);
    throw e;
  }
}

export async function saveScripts() {
  try {
    await ensureScriptsDir();

    const library: ScriptLibrary = {
      meta: {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        source: "CommandSelector Script Manager"
      },
      scripts: scripts.value
    };

    const jsonStr = JSON.stringify(library, null, 2);

    if (isTauri()) {
      await writeTextFile(SCRIPTS_FILE, jsonStr, {
        baseDir: BaseDirectory.AppLocalData
      });
    } else {
      localStorage.setItem("cs_scripts_data", jsonStr);
    }
  } catch (e) {
    console.error("Failed to save scripts:", e);
  }
}

async function generateScriptId(): Promise<string> {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `script-${timestamp}-${random}`;
}

export async function createScript(
  name: string,
  type: ScriptType,
  content: string,
  description?: string,
  sourcePath?: string,
  sourceDir?: string
): Promise<ScriptFileMeta | null> {
  try {
    await ensureScriptsDir();

    // UUID 子目录已保证物理文件唯一性，无需检查重名
    const id = await generateScriptId();
    const timestamp = new Date().toISOString();

    // 构建文件路径：scripts/{type}/{uuid}/{name}.{type}
    let scriptPath: string;
    if (isTauri()) {
      const appDataDir = await appLocalDataDir();
      scriptPath = await join(appDataDir, SCRIPTS_DIR, type, id, `${name}.${type}`);
    } else {
      scriptPath = `/virtual/${SCRIPTS_DIR}/${type}/${id}/${name}.${type}`;
    }

    // 写入文件内容
    if (isTauri()) {
      await invoke("write_script_file", {
        path: scriptPath,
        content
      });
    } else {
      // 网页端保存到 localStorage
      localStorage.setItem(`cs_script_${id}`, content);
    }

    // 解析脚本注释元数据
    const metadata = parseScriptMetadata(content, type);

    // 提取来源目录（如果提供了 sourcePath 但没提供 sourceDir）
    let finalSourceDir = sourceDir;
    if (sourcePath && !sourceDir) {
      finalSourceDir = sourcePath.replace(/[^/\]+$/, "").replace(/[\/]+$/, "");
    }

    // 创建脚本元数据
    const scriptMeta: ScriptFileMeta = {
      id,
      name,
      type,
      path: scriptPath,
      size: content.length,
      createdAt: timestamp,
      updatedAt: timestamp,
      description,
      metadata: metadata || undefined,
      sourcePath,
      sourceDir: finalSourceDir
    };

    scripts.value.push(scriptMeta);
    await saveScripts();

    logger.info('Scripts', 'Script created', { id, name, type, path: scriptPath, sourceDir: finalSourceDir });
    return scriptMeta;
  } catch (e: any) {
    logger.error('Scripts', 'Failed to create script', { name, error: e.message });
    console.error("Failed to create script:", e);
    throw e;
  }
}

export async function updateScript(
  id: string,
  content: string,
  description?: string
): Promise<boolean> {
  try {
    const index = scripts.value.findIndex((s) => s.id === id);
    if (index < 0) {
      throw new Error("脚本不存在");
    }

    const script = scripts.value[index];

    // 更新文件内容
    if (isTauri()) {
      await invoke("write_script_file", {
        path: script.path,
        content
      });
    } else {
      localStorage.setItem(`cs_script_${id}`, content);
    }

    // 解析脚本注释元数据
    const metadata = parseScriptMetadata(content, script.type);

    // 创建新的脚本对象以确保 Vue 响应式更新
    // 注意：如果 metadata 为 null，应该清除元数据，而不是保留旧的
    const updatedScript: ScriptFileMeta = {
      ...script,
      size: content.length,
      updatedAt: new Date().toISOString(),
      description: description !== undefined ? description : script.description,
      metadata: metadata ?? undefined
    };

    // 创建新数组以触发响应式更新（Vue 对数组替换的检测）
    const newScripts = [...scripts.value];
    newScripts[index] = updatedScript;
    scripts.value = newScripts;

    await saveScripts();
    logger.info('Scripts', 'Script updated', { id, size: content.length });
    return true;
  } catch (e: any) {
    logger.error('Scripts', 'Failed to update script', { id, error: e.message });
    console.error("Failed to update script:", e);
    throw e;
  }
}

export async function updateScriptMeta(
  id: string,
  updates: Partial<Pick<ScriptFileMeta, "name" | "description">>
): Promise<boolean> {
  try {
    const index = scripts.value.findIndex((s) => s.id === id);
    if (index < 0) {
      throw new Error("脚本不存在");
    }

    const script = scripts.value[index];

    // 检查名称冲突
    if (updates.name !== undefined && updates.name !== script.name && scripts.value.some((s) => s.name === updates.name)) {
      throw new Error("脚本名称已存在");
    }

    // 创建新的脚本对象以确保 Vue 响应式更新
    const updatedScript: ScriptFileMeta = {
      ...script,
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.description !== undefined && { description: updates.description })
    };

    // 创建新数组以触发响应式更新
    const newScripts = [...scripts.value];
    newScripts[index] = updatedScript;
    scripts.value = newScripts;

    await saveScripts();
    logger.info('Scripts', 'Script metadata updated', { id, updates });
    return true;
  } catch (e: any) {
    logger.error('Scripts', 'Failed to update script meta', { id, error: e.message });
    console.error("Failed to update script meta:", e);
    throw e;
  }
}

export async function deleteScript(id: string): Promise<boolean> {
  try {
    const index = scripts.value.findIndex((s) => s.id === id);
    if (index < 0) {
      throw new Error("脚本不存在");
    }

    const script = scripts.value[index];

    // 删除物理文件
    if (isTauri()) {
      await invoke("delete_script_file", { path: script.path });
    } else {
      localStorage.removeItem(`cs_script_${id}`);
    }

    // 从列表中移除
    scripts.value.splice(index, 1);
    await saveScripts();

    logger.info('Scripts', 'Script deleted', { id, name: script.name, path: script.path });
    return true;
  } catch (e: any) {
    logger.error('Scripts', 'Failed to delete script', { id, error: e.message });
    console.error("Failed to delete script:", e);
    throw e;
  }
}

export async function getScriptContent(id: string): Promise<string> {
  try {
    const script = scripts.value.find((s) => s.id === id);
    if (!script) {
      throw new Error("脚本不存在");
    }

    if (isTauri()) {
      return await invoke("read_script_file", { path: script.path });
    } else {
      const content = localStorage.getItem(`cs_script_${id}`);
      return content ?? "";
    }
  } catch (e: any) {
    console.error("Failed to read script content:", e);
    throw e;
  }
}

export async function importScript(): Promise<ScriptFileMeta | undefined> {
  let importedPath: string | undefined;

  try {
    if (!isTauri()) {
      throw new Error("脚本导入仅在 Tauri 环境中支持");
    }

    // 选择文件
    const selected = await open({
      multiple: false,
      filters: [
        { name: "批处理脚本", extensions: ["bat", "cmd"] },
        { name: "PowerShell 脚本", extensions: ["ps1"] },
        { name: "VBS 脚本", extensions: ["vbs"] },
        { name: "Shell 脚本", extensions: ["sh", "bash"] },
        { name: "Python 脚本", extensions: ["py"] },
        { name: "所有脚本", extensions: ["bat", "cmd", "ps1", "vbs", "sh", "bash", "py"] }
      ]
    });

    if (!selected) return undefined;

    importedPath = selected as string;

    // 读取文件内容
    const content = await invoke("read_script_file", { path: importedPath });

    // 确定脚本类型
    const ext = importedPath.toLowerCase();
    let scriptType: ScriptType = "bat";
    if (ext.endsWith(".ps1")) {
      scriptType = "ps1";
    } else if (ext.endsWith(".vbs")) {
      scriptType = "vbs";
    } else if (ext.endsWith(".sh") || ext.endsWith(".bash")) {
      scriptType = "sh";
    } else if (ext.endsWith(".py")) {
      scriptType = "py";
    } else if (ext.endsWith(".cmd")) {
      scriptType = "cmd";
    }

    // 提取原始文件名（不含扩展名）
    const fileName = importedPath.split(/[/\\]/).pop() || "script";
    const baseName = fileName.replace(/\.(bat|cmd|ps1|vbs|sh|bash|py)$/i, "");

    // 提取来源目录
    const sourceDir = importedPath.replace(/[^/\\]+$/, "").replace(/[\/\\]+$/, "");

    // 创建新脚本（直接使用原始文件名，UUID 子目录保证物理文件唯一）
    const result = await createScript(baseName, scriptType, content as string, undefined, importedPath, sourceDir);
    logger.info('Scripts', 'Script imported', { originalPath: importedPath, importedAs: baseName, type: scriptType, sourceDir });
    return result ?? undefined;
  } catch (e: any) {
    logger.error('Scripts', 'Failed to import script', { originalPath: importedPath, error: e.message });
    console.error("Failed to import script:", e);
    throw e;
  }
}

export async function exportScript(
  id: string,
  outputPath?: string
): Promise<string | undefined> {
  try {
    const script = scripts.value.find((s) => s.id === id);
    if (!script) {
      throw new Error("脚本不存在");
    }

    const content = await getScriptContent(id);
    const defaultFileName = `${script.name}.${script.type}`;

    if (isTauri()) {
      let finalOutputPath: string | undefined = outputPath;
      if (!finalOutputPath) {
        const typeNames: Record<ScriptType, string> = {
          bat: "批处理脚本",
          ps1: "PowerShell 脚本",
          vbs: "VBS 脚本",
          sh: "Shell 脚本",
          cmd: "CMD 脚本",
          py: "Python 脚本"
        };
        const saveResult: string | null = await save({
          defaultPath: defaultFileName,
          filters: [
            {
              name: typeNames[script.type] || "脚本",
              extensions: [script.type]
            }
          ]
        });
        if (saveResult) {
          finalOutputPath = saveResult;
        } else {
          return undefined;
        }
      }

      // 确保此时 finalOutputPath 不是 null 或 undefined
      await invoke("copy_script_file", {
        src: script.path,
        dst: finalOutputPath
      });
      logger.info('Scripts', 'Script exported', { id, outputPath: finalOutputPath });
      return finalOutputPath;
    } else {
      // 网页端下载
      const blob = new Blob([content], {
        type: script.type === "bat"
          ? "text/plain"
          : "application/x-powershell"
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = defaultFileName;
      a.click();
      URL.revokeObjectURL(url);

      return defaultFileName;
    }
  } catch (e: any) {
    logger.error('Scripts', 'Failed to export script', { id, error: e.message });
    console.error("Failed to export script:", e);
    throw e;
  }
}

export function createCommandFromScript(id: string, scriptContent?: string): CommandEntry | null {
  const script = scripts.value.find((s) => s.id === id);
  if (!script) return null;

  const content = scriptContent ?? "";

  return {
    id: `cmd-${Date.now()}`,
    name: script.name,
    description: script.description ?? `从 ${script.type.toUpperCase()} 脚本导入`,
    category: "批处理脚本",
    tags: [script.type.toUpperCase()],
    engine: script.type === "bat" ? "cmd" : "cmd+powershell",
    template: script.type === "bat" ? content : "",
    powershellTemplate: script.type === "ps1" ? content : undefined,
    params: [],
    platform: "windows",
    usage: "",
    updatedAt: script.updatedAt
  };
}

export function useScriptsStore() {
  return {
    scripts,
    isLoaded,
    errorMsg,
    loadScripts,
    saveScripts,
    createScript,
    updateScript,
    updateScriptMeta,
    deleteScript,
    getScriptContent,
    importScript,
    exportScript,
    createCommandFromScript
  };
}