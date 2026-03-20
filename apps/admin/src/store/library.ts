import { ref } from "vue";
import type { CommandEntry } from "@commandselector/shared";

// Tauri plugins
import { readTextFile, writeTextFile, BaseDirectory } from "@tauri-apps/plugin-fs";
import { save, open } from "@tauri-apps/plugin-dialog";
import { isTauri } from "@tauri-apps/api/core";

const commands = ref<CommandEntry[]>([]);
const isLoaded = ref(false);
const errorMsg = ref("");

const LIBRARY_FILE = "library.json";

type RetryOptions = {
  attempts: number;
  baseDelayMs: number;
};

function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < options.attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < options.attempts - 1) {
        await wait(options.baseDelayMs * 2 ** attempt);
      }
    }
  }
  throw lastError;
}

export async function loadLibrary() {
  if (isLoaded.value) return;
  try {
    let data: CommandEntry[] | null = null;
    let shouldSave = false;
    let localError: unknown = null;
    let remoteError: unknown = null;

    if (isTauri()) {
      try {
        data = await withRetry(
          async () => {
            const fileContent = await readTextFile(LIBRARY_FILE, { baseDir: BaseDirectory.AppLocalData });
            return JSON.parse(fileContent) as CommandEntry[];
          },
          { attempts: 3, baseDelayMs: 200 }
        );
      } catch (error) {
        localError = error;
      }
    } else {
      try {
        data = await withRetry(
          async () => {
            const localData = localStorage.getItem("cs_library_data");
            if (!localData) return null;
            return JSON.parse(localData) as CommandEntry[];
          },
          { attempts: 3, baseDelayMs: 200 }
        );
      } catch (error) {
        localError = error;
      }
    }

    if (!data) {
      try {
        data = await withRetry(
          async () => {
            const response = await fetch("/library.json");
            if (!response.ok) throw new Error(`无法加载默认库: HTTP ${response.status}`);
            return (await response.json()) as CommandEntry[];
          },
          { attempts: 3, baseDelayMs: 200 }
        );
        shouldSave = true;
      } catch (error) {
        remoteError = error;
      }
    }

    if (!data) {
      const localMessage = localError ? toErrorMessage(localError) : "无本地缓存";
      const remoteMessage = remoteError ? toErrorMessage(remoteError) : "未执行远端拉取";
      throw new Error(`加载失败: 本地(${localMessage}); 远端(${remoteMessage})`);
    }

    if (!Array.isArray(data)) {
      throw new Error("数据格式错误：应为 JSON 数组");
    }

    commands.value = data;
    if (shouldSave) {
      await saveLibrary();
    }

    isLoaded.value = true;
  } catch (e: any) {
    console.error("Failed to load library:", e);
    errorMsg.value = e.message || "加载数据失败";
  }
}

export async function saveLibrary() {
  try {
    const jsonStr = JSON.stringify(commands.value, null, 2);
    if (isTauri()) {
      await writeTextFile(LIBRARY_FILE, jsonStr, { baseDir: BaseDirectory.AppLocalData });
    } else {
      localStorage.setItem("cs_library_data", jsonStr);
    }
  } catch (e) {
    console.error("Failed to save library:", e);
  }
}

export async function saveCommand(entry: CommandEntry) {
  const index = commands.value.findIndex((c) => c.id === entry.id);
  if (index >= 0) {
    commands.value[index] = { ...entry };
  } else {
    commands.value.push({ ...entry });
  }
  await saveLibrary();
}

export async function importLibrary(fileContent?: string): Promise<boolean> {
  try {
    let dataStr = fileContent;
    
    // 如果没有传内容并且在 Tauri 环境，则调用原生弹窗选择文件
    if (!dataStr && isTauri()) {
      const selected = await open({
        multiple: false,
        filters: [{ name: "JSON", extensions: ["json"] }]
      });
      if (!selected) return false;
      dataStr = await readTextFile(selected as string);
    }
    
    if (!dataStr) return false;

    const data = JSON.parse(dataStr);
    if (!Array.isArray(data)) {
      throw new Error("导入格式错误：应为 JSON 数组");
    }
    commands.value = data;
    await saveLibrary();
    return true;
  } catch (e: any) {
    console.error("Import failed:", e);
    alert(`导入失败: ${e.message}`);
    return false;
  }
}

export async function exportLibrary() {
  try {
    const dataStr = JSON.stringify(commands.value, null, 2);
    const dateStr = new Date().toISOString().split("T")[0];
    const defaultFileName = `library_${dateStr}.json`;

    if (isTauri()) {
      const savePath = await save({
        defaultPath: defaultFileName,
        filters: [{ name: "JSON", extensions: ["json"] }]
      });
      if (savePath) {
        await writeTextFile(savePath, dataStr);
        alert("导出成功");
      }
    } else {
      // 网页端降级：利用 a 标签下载
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = defaultFileName;
      a.click();
      URL.revokeObjectURL(url);
    }
  } catch (e: any) {
    console.error("Export failed:", e);
    alert(`导出失败: ${e.message}`);
  }
}

export function useLibraryStore() {
  return {
    commands,
    isLoaded,
    errorMsg,
    loadLibrary,
    saveLibrary,
    saveCommand,
    importLibrary,
    exportLibrary,
  };
}
