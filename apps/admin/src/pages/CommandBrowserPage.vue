<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { CommandBrowser } from "@commandselector/ui";
import { useLibraryStore } from "../store/library";
import { isTauri } from "@tauri-apps/api/core";

const router = useRouter();
const route = useRoute();

const { commands, isLoaded, errorMsg, loadLibrary, exportLibrary, importLibrary } = useLibraryStore();

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

function onCreate() {
  router.push({ name: "edit", params: { id: "new" } });
}

function handleEdit(id: string) {
  router.push({ name: "edit", params: { id } });
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
</script>

<template>
  <div v-if="!isLoaded && !errorMsg" style="padding: 24px; text-align: center; color: #666;">
    正在加载命令库数据...
  </div>
  <div v-else-if="errorMsg" style="padding: 24px; text-align: center; color: #ef4444;">
    {{ errorMsg }}
  </div>
  <CommandBrowser
    v-else
    :commands="commands"
    :selected-id="selectedId"
    :responsive="{ scaleOverride }"
    @select="onSelect"
    @create="onCreate"
    @edit="handleEdit"
    @import="handleImport"
    @export="handleExport"
  />
</template>
