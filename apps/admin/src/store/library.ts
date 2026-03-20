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

export async function loadLibrary() {
  if (isLoaded.value) return;
  try {
    let data: CommandEntry[] | null = null;
    
    if (isTauri()) {
      try {
        const fileContent = await readTextFile(LIBRARY_FILE, { baseDir: BaseDirectory.AppLocalData });
        data = JSON.parse(fileContent);
      } catch (err) {
        console.warn("Local file not found or read error, fallback to public library.json", err);
      }
    } else {
      const localData = localStorage.getItem("cs_library_data");
      if (localData) {
        data = JSON.parse(localData);
      }
    }

    if (!data) {
      const response = await fetch("/library.json");
      if (response.ok) {
        data = await response.json();
        if (data) {
          commands.value = data;
          await saveLibrary();
        }
      } else {
        throw new Error(`无法加载默认库: HTTP ${response.status}`);
      }
    } else {
      commands.value = data;
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
