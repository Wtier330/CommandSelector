<script setup lang="ts">
import { ref } from "vue";
import ProjectInfoModal from "./ProjectInfoModal.vue";

const showModal = ref(false);

function handleGithubClick() {
  showModal.value = true;
}

async function handleOpenUrl(url: string) {
  try {
    // 尝试使用 Tauri opener 插件
    const opener = await import("@tauri-apps/plugin-opener");
    await opener.openUrl(url);
  } catch {
    // 降级到 window.open
    window.open(url, "_blank");
  }
}
</script>

<template>
  <div class="cs-bottom-statusbar" data-testid="statusbar">
    <button class="cs-statusbar-btn" @click="handleGithubClick" title="项目信息">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        width="16"
        height="16"
        fill="currentColor"
      >
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
      </svg>
    </button>
    <span class="cs-statusbar-text">CommandSelector - 快捷生成并复制你的运维指令</span>
  </div>
  <ProjectInfoModal :is-open="showModal" @close="showModal = false" @open-url="handleOpenUrl" />
</template>

<style scoped>
.cs-bottom-statusbar {
  display: flex;
  align-items: center;
  height: 24px;
  background-color: var(--cs-statusbar-bg, #ffffff);
  color: var(--cs-statusbar-text, #CCCCCC);
  padding: 0;
  flex-shrink: 0;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  z-index: 40;
  width: 100%;
  bottom: 0;
  left: 0;
  border-top: 1px solid var(--cs-statusbar-border, #E5E5E5);
}

.cs-statusbar-btn {
  background: transparent;
  border: none;
  color: #CCCCCC;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0 12px;
  cursor: pointer;
  transition: color 0.2s, background-color 0.2s;
  outline: none;
}

.cs-statusbar-btn:hover {
  color: #FFFFFF;
  background-color: rgba(255, 255, 255, 0.1);
}

.cs-statusbar-text {
  font-size: 14px;
  margin-left: 8px;
  margin-right: 12px;
}
</style>
