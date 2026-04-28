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
    // 代理配置解决 CORS 问题（仅开发环境）
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
      },
      // Anthropic API
      '/api/anthropic': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => {
          const result = path.replace(/^\/api\/anthropic/, '');
          console.log('[Vite Proxy] rewrite:', path, '→', result);
          return result;
        },
      },
      // OpenAI API
      '/api/openai': {
        target: 'https://api.openai.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => {
          const result = path.replace(/^\/api\/openai/, '');
          console.log('[Vite Proxy] rewrite:', path, '→', result);
          return result;
        },
      },
      // OpenRouter API
      '/api/openrouter': {
        target: 'https://openrouter.ai',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => {
          const result = path.replace(/^\/api\/openrouter/, '');
          console.log('[Vite Proxy] rewrite:', path, '→', result);
          return result;
        },
      },
    },
  },
  build: {
    // 确保内联 CSS 被正确提取
    cssCodeSplit: false,
    // 优化依赖预构建
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
}));
