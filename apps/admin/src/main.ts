import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";
import { isTauri } from "@tauri-apps/api/core";
import { logger } from "./utils/logger";
import "./styles/editor.css";

createApp(App).use(router).mount("#app");

logger.info('App', 'Application mounted', { isTauri: isTauri() });

// 添加全局诊断快捷键（Ctrl+Shift+L）
// 全局快捷键 - Ctrl+F 聚焦搜索框（在 Tauri 和 Web 环境都生效）
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'f') {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('focus-search'));
  }
});

// Tauri 环境额外快捷键
if (isTauri()) {
  window.addEventListener('keydown', async (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'L') {
      e.preventDefault();
      await showLogDiagnostics();
    }
    // Ctrl+Shift+D 显示日志目录
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      e.preventDefault();
      await showLogsDirectory();
    }
  });

  import("@tauri-apps/api/window")
    .then(async (m) => {
      const win = m.getCurrentWindow();
      const fire = () => window.dispatchEvent(new Event("resize"));
      await win.onResized(fire);
      await win.onScaleChanged(fire);
    })
    .catch(() => {});
}

async function showLogDiagnostics() {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const dialog = await import('@tauri-apps/plugin-dialog');

    const diagnosis = await invoke('diagnose_logs');
    const isReady = logger.isReady();

    let fullMessage = `日志系统状态: ${isReady ? '✓ 正常' : '✗ 未初始化'}\n\n${diagnosis}`;

    if (!isReady) {
      const error = logger.getInitError();
      if (error) {
        fullMessage += `\n初始化错误: ${JSON.stringify(error)}`;
      }
    }

    await dialog.message(fullMessage, {
      title: '日志系统诊断',
      kind: 'info'
    });
  } catch (e: any) {
    console.error('Failed to show log diagnostics:', e);
  }
}

async function showLogsDirectory() {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const dialog = await import('@tauri-apps/plugin-dialog');

    const logsDir = await invoke('get_logs_dir');

    await dialog.message(`日志文件存储在:\n\n${logsDir}\n\n提示: 按 Ctrl+Shift+L 查看详细诊断`, {
      title: '日志目录',
      kind: 'info'
    });
  } catch (e: any) {
    console.error('Failed to show logs directory:', e);
  }
}
