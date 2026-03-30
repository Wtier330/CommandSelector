import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import pkg from './package.json' assert { type: 'json' };

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: { alias: { '@': path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../../packages/ui/src') } },
  plugins: [vue()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 3002,
    strictPort: true,
    host: host || "127.0.0.1",
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 3003,
        }
      : undefined,
    fs: {
      allow: ["..", "../../packages/shared", "../../packages/ui"],
    },
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
