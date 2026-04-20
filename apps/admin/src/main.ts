import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";
import { isTauri } from "@tauri-apps/api/core";

// 配置 Monaco Editor Worker（在应用启动时设置）
(self as any).MonacoEnvironment = {
  getWorker: function () {
    // 返回 undefined 让 Monaco 在主线程运行
    return undefined;
  }
};

createApp(App).use(router).mount("#app");

// 捕获 Monaco Editor Worker 错误，防止控制台报错
window.addEventListener('error', (event) => {
  // 捕获 Worker 相关错误
  if (event.target instanceof Worker || event.message?.includes('Worker')) {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
}, true);

// 捕获未处理的 Promise 错误
window.addEventListener('unhandledrejection', (event) => {
  // 抑制 Monaco Worker 相关的错误
  const reason = event.reason;
  if (!reason) return;

  const reasonStr = reason.toString() || String(reason) || '';

  if (reasonStr.includes('Worker') ||
      reasonStr.includes('postMessage') ||
      reason.message?.includes('Worker') ||
      reason.message?.includes('postMessage')) {
    event.preventDefault();
    console.warn('Monaco Worker error suppressed:', reason);
  }
});

if (isTauri()) {
  import("@tauri-apps/api/window")
    .then(async (m) => {
      const win = m.getCurrentWindow();
      const fire = () => window.dispatchEvent(new Event("resize"));
      await win.onResized(fire);
      await win.onScaleChanged(fire);
    })
    .catch(() => {});
}
