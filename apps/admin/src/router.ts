import { createRouter, createWebHashHistory } from "vue-router";
import CommandBrowserPage from "./pages/CommandBrowserPage.vue";
import CommandEditorPage from "./pages/CommandEditorPage.vue";
import PublishPage from "./pages/PublishPage.vue";
import SettingsPage from "./pages/SettingsPage.vue";

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", name: "commands", component: CommandBrowserPage },
    { path: "/edit/:id", name: "edit", component: CommandEditorPage },
    { path: "/publish", name: "publish", component: PublishPage },
    { path: "/settings", name: "settings", component: SettingsPage },
  ],
});
