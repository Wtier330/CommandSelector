import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";
import { isTauri } from "@tauri-apps/api/core";

createApp(App).use(router).mount("#app");

// 捕获 Monaco Editor Worker 错误，防止控制台报错
window.addEventListener('error', (event) => {
  if (event.target instanceof Worker) {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
}, true);

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
