<script setup lang="ts">
import { ref, shallowRef, onMounted, onUnmounted } from "vue";
import { NConfigProvider, NMessageProvider, NDialogProvider, NNotificationProvider } from "naive-ui";
import MessageContainer from "./components/MessageContainer.vue";

// 动态组件加载 - 使用 shallowRef 避免对组件对象进行响应式追踪
const AsyncSettingsModal = shallowRef<any>(null);
const AsyncProjectInfoModal = shallowRef<any>(null);
const AsyncAIConfigDialog = shallowRef<any>(null);

// 全局快捷键：监听 Tauri 后端发出的热键事件
let hotkeyUnlisten: (() => void) | null = null;

async function setupGlobalHotkeyListener() {
  try {
    const { listen } = await import("@tauri-apps/api/event");
    const { invoke } = await import("@tauri-apps/api/core");

    // 监听热键按下事件
    hotkeyUnlisten = await listen("global-hotkey-pressed", async () => {
      try {
        await invoke("toggle_window_visibility");
      } catch (e) {
        console.error("全局快捷键切换窗口失败:", e);
      }
    });

    // 启动时自动注册默认快捷键（Alt+C）
    try {
      const config = await invoke<{
        enabled: boolean;
        modifiers: number;
        virtual_key: number;
        display_name: string;
      }>("get_default_hotkey");
      if (config.enabled) {
        await invoke("register_global_hotkey", {
          modifiers: config.modifiers,
          vk: config.virtual_key,
        });
      }
    } catch (e) {
      console.error("自动注册快捷键失败:", e);
    }
  } catch {
    // 非 Tauri 环境，忽略
  }
}

onMounted(() => {
  setupGlobalHotkeyListener();
});

onUnmounted(() => {
  if (hotkeyUnlisten) {
    hotkeyUnlisten();
    hotkeyUnlisten = null;
  }
});

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
    <!-- 消息通知容器 -->
    <MessageContainer />

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
