import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from "module";
import { defineConfig } from 'vite';
import vue from "@vitejs/plugin-vue";
const require = createRequire(import.meta.url);
const pkg = require("./package.json") as { version: string };

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: { alias: { '@': path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../../packages/ui/src') } },
  plugins: [vue()],

  // 预构建 Monaco Editor 以避免 403 错误
  optimizeDeps: {
    exclude: ['monaco-editor'],
  },

  // Monaco Editor 资源处理
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'monaco-editor': ['monaco-editor']
        }
      }
    }
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 5173,
    strictPort: false,
    host: host || "127.0.0.1",
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 5174,
        }
      : undefined,
    fs: {
      allow: ["..", "../../packages/shared", "../../packages/ui", "node_modules", "node_modules/.pnpm"],
    },
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
    // 代理配置解决 CORS 问题
    proxy: {
      // 火山引擎/字节跳动 API
      '/api/volces': {
        target: 'https://ark.cn-beijing.volces.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => {
          const result = path.replace(/^\/api\/volces/, '');
          console.log('[Vite Proxy] rewrite:', path, '→', result);
          return result;
        },
        configure: (proxy, options) => {
          console.log('[Vite Proxy] Configured for /api/volces');
        },
      },
    },
  },
}));
