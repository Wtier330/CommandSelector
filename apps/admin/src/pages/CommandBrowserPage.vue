<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { CommandBrowser } from "@commandselector/ui";
import { useLibraryStore } from "../store/library";
import { isTauri } from "@tauri-apps/api/core";

const router = useRouter();
const route = useRoute();
const browserRef = ref<InstanceType<typeof CommandBrowser> | null>(null);

const { commands, trashedCommands, isLoaded, errorMsg, loadLibrary, exportLibrary, importLibrary, saveCommand, moveToTrash, restoreCommand, deletePermanently, emptyTrash } = useLibraryStore();

onMounted(async () => {
  await loadLibrary();
});

const selectedId = computed(() => String(route.query.id ?? ""));

const scaleOverride = computed(() => {
  const raw = String(route.query.scale ?? "").trim();
  if (!raw) return "auto" as const;
  const n = Number(raw);
  return Number.isFinite(n) ? n : ("auto" as const);
});

function onSelect(id: string) {
  router.replace({ name: "commands", query: { ...route.query, id } });
}

async function onCreate() {
  const newId = "cmd-" + Date.now();
  const newCommand = {
    id: newId,
    name: "新建命令",
    description: "",
    category: "未分类",
    tags: [],
    engine: "cmd" as const,
    template: "",
    params: [],
    platform: "windows" as const,
    usage: ""
  };
  await saveCommand(newCommand);
  router.replace({ name: "commands", query: { ...route.query, id: newId } });

  setTimeout(() => {
    browserRef.value?.startEdit();
  }, 100);
}

function handleImport() {
  if (isTauri()) {
    // 在 Tauri 环境中直接调用 importLibrary（会触发原生选择文件弹窗）
    importLibrary().then((success) => {
      if (success) alert("导入成功！");
    });
  } else {
    // 网页端降级：利用 input file 选择文件
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const content = ev.target?.result as string;
        if (content) {
          const success = await importLibrary(content);
          if (success) alert("导入成功！");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }
}

function handleExport() {
  exportLibrary();
}

function handleDelete(id: string) {
  moveToTrash(id);
  if (selectedId.value === id) {
    router.replace({ name: "commands", query: { ...route.query, id: undefined } });
  }
}

function handleRestoreTrash(id: string) {
  restoreCommand(id);
}

function handleDeletePermanently(id: string) {
  deletePermanently(id);
}

function handleEmptyTrash() {
  emptyTrash();
}
</script>

<template>
  <div v-if="!isLoaded && !errorMsg" style="padding: 24px; text-align: center; color: #666;">
    正在加载命令库数据...
  </div>
  <div v-else-if="errorMsg" style="padding: 24px; text-align: center; color: #ef4444;">
    {{ errorMsg }}
  </div>
  <CommandBrowser
    ref="browserRef"
    v-else
    :commands="commands"
    :selected-id="selectedId"
    :responsive="{ scaleOverride }"
    @select="onSelect"
    @create="onCreate"
    @import="handleImport"
    @export="handleExport"
    @update:command="saveCommand"
    @delete="handleDelete"
    @restore-trash="handleRestoreTrash"
    @delete-permanently="handleDeletePermanently"
    @empty-trash="handleEmptyTrash"
  />
</template>
