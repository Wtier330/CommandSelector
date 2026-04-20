<script setup lang="ts">
import { ref } from "vue";
import { NConfigProvider, NMessageProvider, NDialogProvider, NNotificationProvider } from "naive-ui";

// 动态组件加载
const AsyncSettingsModal = ref<any>(null);
const AsyncProjectInfoModal = ref<any>(null);
const AsyncAIConfigDialog = ref<any>(null);

// 设置模态框
const showSettings = ref(false);
const showProjectInfo = ref(false);
const showAIConfig = ref(false);

// 定义系统信息
const systemInfo = ref<{
  librarySource: string;
  lastUpdateTime: number;
  commandCount: number;
} | null>(null);

async function loadSettingsModal() {
  if (!AsyncSettingsModal.value) {
    const module = await import("@commandselector/ui");
    AsyncSettingsModal.value = module.SettingsModal;
  }
}

async function loadProjectInfoModal() {
  if (!AsyncProjectInfoModal.value) {
    const module = await import("@commandselector/ui");
    AsyncProjectInfoModal.value = module.ProjectInfoModal;
  }
}

async function loadAIConfigDialog() {
  if (!AsyncAIConfigDialog.value) {
    const module = await import("@commandselector/ui");
    AsyncAIConfigDialog.value = module.AIConfigDialog;
  }
}


async function handleOpenUrl(url: string) {
  try {
    const opener = await import("@tauri-apps/plugin-opener");
    await opener.openUrl(url);
  } catch {
    window.open(url, "_blank");
  }
}

function handleImport() {
  window.dispatchEvent(new CustomEvent("cs-import"));
  showSettings.value = false;
}

function handleExport() {
  window.dispatchEvent(new CustomEvent("cs-export"));
  showSettings.value = false;
}

function handleOpenTrash() {
  window.dispatchEvent(new CustomEvent("cs-open-trash"));
}

function handleOpenAIConfig() {
  window.dispatchEvent(new CustomEvent("cs-open-ai-config"));
}

// 监听打开设置
window.addEventListener("cs-open-settings", async () => {
  await loadSettingsModal();
  showSettings.value = true;
  window.dispatchEvent(new CustomEvent("cs-request-system-info"));
});

// 监听打开项目信息
window.addEventListener("cs-open-project-info", async () => {
  await loadProjectInfoModal();
  showProjectInfo.value = true;
});

// 监听系统信息请求
window.addEventListener("cs-request-system-info", () => {
  window.dispatchEvent(new CustomEvent("cs-system-info-response", {
    detail: systemInfo.value
  }));
});

// 监听系统信息响应（来自 CommandBrowserPage）
window.addEventListener("cs-system-info-response", ((e: any) => {
  systemInfo.value = e.detail;
}) as EventListener);

// 监听关闭设置
window.addEventListener("cs-close-settings", () => {
  showSettings.value = false;
});

// 监听关闭项目信息
window.addEventListener("cs-close-project-info", () => {
  showProjectInfo.value = false;
});

// 监听打开 AI 配置
window.addEventListener("cs-open-ai-config", async () => {
  await loadAIConfigDialog();
  showAIConfig.value = true;
});

// 监听系统信息更新
window.addEventListener("cs-system-info-update", ((e: any) => {
  systemInfo.value = e.detail;
}) as EventListener);
</script>

<template>
  <div>
    <n-config-provider>
      <n-message-provider>
        <n-dialog-provider>
          <n-notification-provider>
            <router-view />
          </n-notification-provider>
        </n-dialog-provider>
      </n-message-provider>
    </n-config-provider>

    <!-- SettingsModal 和 ProjectInfoModal 通过 NTeleport 动态挂载 -->
    <component
      v-if="AsyncSettingsModal"
      :is="AsyncSettingsModal"
      :is-open="showSettings"
      :library-source="systemInfo?.librarySource"
      :last-update-time="systemInfo?.lastUpdateTime"
      :command-count="systemInfo?.commandCount"
      @close="showSettings = false"
      @import="handleImport"
      @export="handleExport"
      @open-trash="handleOpenTrash"
      @open-a-i-config="handleOpenAIConfig"
    />
    <component
      v-if="AsyncProjectInfoModal"
      :is="AsyncProjectInfoModal"
      :is-open="showProjectInfo"
      @close="showProjectInfo = false"
      @open-url="handleOpenUrl"
    />
    <component
      v-if="AsyncAIConfigDialog"
      :is="AsyncAIConfigDialog"
      :is-open="showAIConfig"
      @close="showAIConfig = false"
      @save="showAIConfig = false"
    />
  </div>
</template>
