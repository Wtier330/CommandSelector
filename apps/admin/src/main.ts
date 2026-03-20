import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";
import { isTauri } from "@tauri-apps/api/core";

createApp(App).use(router).mount("#app");

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
