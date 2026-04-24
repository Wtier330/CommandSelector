<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from "vue";

// @ts-ignore
const APP_VERSION = __APP_VERSION__ || "1.3.5";

const props = defineProps<{
  isOpen: boolean;
  librarySource?: string;
  lastUpdateTime?: number;
  commandCount?: number;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "import"): void;
  (e: "export"): void;
  (e: "openTrash"): void;
  (e: "openAIConfig"): void;
}>();

type TabType = "data" | "function" | "about";
const activeTab = ref<TabType>("data");

const tabs = computed(() => [
  { key: "data" as TabType, label: "数据管理", icon: "database" },
  { key: "function" as TabType, label: "功能配置", icon: "settings" },
  { key: "about" as TabType, label: "系统信息", icon: "info" },
]);

interface AppPathInfo {
  name: string;
  path: string;
  description: string;
}

const appPaths = ref<AppPathInfo[]>([]);

async function loadAppPaths() {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const { isTauri } = await import('@tauri-apps/api/core');

    if (!isTauri()) {
      console.log("Not running in Tauri environment, using mock paths");
      // 在浏览器环境下使用模拟数据
      appPaths.value = [
        {
          name: "应用数据目录",
          path: "C:\Users\User\AppData\Local\CommandSelector",
          description: "存储所有应用数据"
        },
        {
          name: "日志目录",
          path: "C:\Users\User\AppData\Local\CommandSelector\logs",
          description: "存储应用日志文件"
        },
        {
          name: "脚本数据目录",
          path: "C:\Users\User\AppData\Local\CommandSelector\scripts",
          description: "存储脚本物理文件"
        },
        {
          name: "程序目录",
          path: "C:\Program Files\CommandSelector",
          description: "应用安装目录"
        }
      ];
      return;
    }

    console.log("Loading app paths...");
    const paths = await invoke<AppPathInfo[]>("get_app_paths");
    console.log("App paths loaded:", paths);
    appPaths.value = paths;
  } catch (e) {
    console.error("Failed to load app paths:", e);
    console.error("Error details:", JSON.stringify(e));
  }
}

async function openPath(path: string) {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const { isTauri } = await import('@tauri-apps/api/core');

    if (!isTauri()) {
      console.log("Not in Tauri environment, cannot open path");
      return;
    }

    await invoke('open_in_explorer', { path });
    console.log("Opened path in explorer:", path);
  } catch (e) {
    console.error("Failed to open path:", e);
  }
}

function handleImport() {
  emit("import");
  emit("close");
}

function handleExport() {
  emit("export");
  emit("close");
}

function handleOpenTrash() {
  emit("openTrash");
  emit("close");
}

function handleOpenAIConfig() {
  emit("openAIConfig");
  emit("close");
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === "Escape" && props.isOpen) {
    emit("close");
  }
}

function handleOpenSettings() {
  loadAppPaths();
}

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("cs-open-settings", handleOpenSettings);
  // 初始化时加载路径信息
  loadAppPaths();
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("cs-open-settings", handleOpenSettings);
});
</script>

<template>
  <transition name="cs-fade">
    <div v-if="isOpen" class="cs-modal-overlay" @click.self="emit('close')">
      <div class="cs-modal-card">
        <div class="cs-modal-header">
          <h3 class="cs-modal-title">设置</h3>
          <button class="cs-modal-close" @click="emit('close')">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="cs-modal-content">
          <div class="cs-sidebar">
            <div
              v-for="tab in tabs"
              :key="tab.key"
              class="cs-sidebar-item"
              :class="{ active: activeTab === tab.key }"
              @click="activeTab = tab.key"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path v-if="tab.icon === 'database'" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline v-if="tab.icon === 'database'" points="7 10 12 15 17 10"></polyline>
                <line v-if="tab.icon === 'database'" x1="12" y1="15" x2="12" y2="3"></line>
                <circle v-if="tab.icon === 'settings'" cx="12" cy="12" r="3"></circle>
                <path v-if="tab.icon === 'settings'" d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                <circle v-if="tab.icon === 'info'" cx="12" cy="12" r="10"></circle>
                <line v-if="tab.icon === 'info'" x1="12" y1="16" x2="12" y2="12"></line>
                <line v-if="tab.icon === 'info'" x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <span>{{ tab.label }}</span>
            </div>
          </div>

          <div class="cs-modal-body">
            <div v-if="activeTab === 'data'" class="cs-tab-content">
              <div class="cs-card-grid">
                <button class="cs-card cs-card-import" @click="handleImport">
                  <div class="cs-card-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                  </div>
                  <span class="cs-card-title">导入配置</span>
                  <span class="cs-card-desc">备份文件恢复</span>
                </button>

                <button class="cs-card cs-card-export" @click="handleExport">
                  <div class="cs-card-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                  </div>
                  <span class="cs-card-title">导出配置</span>
                  <span class="cs-card-desc">生成备份文件</span>
                </button>
              </div>
            </div>

            <div v-if="activeTab === 'function'" class="cs-tab-content">
              <div class="cs-card-list">
                <button class="cs-card cs-card-trash" @click="handleOpenTrash">
                  <div class="cs-card-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1 -1 2 -2 2H7c-1 0 -2 -1 -2 -2V6"></path>
                      <path d="M8 6V4c0 -1 1 -2 2 -2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                  </div>
                  <div class="cs-card-content">
                    <span class="cs-card-title">回收站</span>
                    <span class="cs-card-desc">查看已删除的命令</span>
                  </div>
                  <svg class="cs-card-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>

                <button class="cs-card cs-card-ai" @click="handleOpenAIConfig">
                  <div class="cs-card-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                  </div>
                  <div class="cs-card-content">
                    <span class="cs-card-title">AI 配置</span>
                    <span class="cs-card-desc">配置 AI 自动生成元数据</span>
                  </div>
                  <svg class="cs-card-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </div>
            </div>

            <div v-if="activeTab === 'about'" class="cs-tab-content">
              <div class="cs-about-section">
                <div class="cs-info-card">
                  <div class="cs-info-header">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <span class="cs-info-title">应用信息</span>
                  </div>
                  <div class="cs-info-list">
                    <div class="cs-info-item">
                      <span class="cs-info-label">版本</span>
                      <span class="cs-info-value">v{{ APP_VERSION }}</span>
                    </div>
                    <div v-if="librarySource" class="cs-info-item">
                      <span class="cs-info-label">数据源</span>
                      <span v-if="librarySource.includes('AppLocalData')" class="cs-info-tag cs-info-tag-success">本地文件</span>
                      <span v-else-if="librarySource.includes('localStorage')" class="cs-info-tag cs-info-tag-info">浏览器</span>
                      <span v-else-if="librarySource.includes('/library.json')" class="cs-info-tag cs-info-tag-warning">应用默认</span>
                      <span v-else class="cs-info-tag">其他</span>
                    </div>
                    <div v-if="commandCount !== undefined" class="cs-info-item">
                      <span class="cs-info-label">命令数</span>
                      <span class="cs-info-value">{{ commandCount }} 条</span>
                    </div>
                    <div v-if="lastUpdateTime" class="cs-info-item">
                      <span class="cs-info-label">更新时间</span>
                      <span class="cs-info-value">{{ new Date(lastUpdateTime).toLocaleString('zh-CN') }}</span>
                    </div>
                  </div>
                </div>

                <div class="cs-info-card" v-if="appPaths.length > 0">
                  <div class="cs-info-header">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <span class="cs-info-title">数据路径</span>
                  </div>
                  <div class="cs-paths-list">
                    <div v-for="pathInfo in appPaths" :key="pathInfo.name" class="cs-path-item" @click="openPath(pathInfo.path)">
                      <div class="cs-path-main">
                        <div class="cs-path-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2z"></path>
                          </svg>
                        </div>
                        <div class="cs-path-info">
                          <span class="cs-path-name">{{ pathInfo.name }}</span>
                          <span class="cs-path-desc">{{ pathInfo.description }}</span>
                        </div>
                      </div>
                      <button class="cs-path-open-btn" title="在资源管理器中打开">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div class="cs-info-card">
                  <div class="cs-info-header">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                    <span class="cs-info-title">快捷键</span>
                  </div>
                  <div class="cs-info-list cs-shortcuts">
                    <div class="cs-shortcut-item">
                      <span class="cs-shortcut-label">搜索</span>
                      <span class="cs-shortcut-keys">
                        <kbd class="cs-kbd">Ctrl</kbd> + <kbd class="cs-kbd">F</kbd>
                      </span>
                    </div>
                    <div class="cs-shortcut-item">
                      <span class="cs-shortcut-label">新建命令</span>
                      <span class="cs-shortcut-keys">
                        <kbd class="cs-kbd">Ctrl</kbd> + <kbd class="cs-kbd">N</kbd>
                      </span>
                    </div>
                    <div class="cs-shortcut-item">
                      <span class="cs-shortcut-label">保存</span>
                      <span class="cs-shortcut-keys">
                        <kbd class="cs-kbd">Ctrl</kbd> + <kbd class="cs-kbd">S</kbd>
                      </span>
                    </div>
                    <div class="cs-shortcut-item">
                      <span class="cs-shortcut-label">清空搜索</span>
                      <span class="cs-shortcut-keys">
                        <kbd class="cs-kbd">ESC</kbd>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.cs-fade-enter-active,
.cs-fade-leave-active {
  transition: opacity 0.2s ease;
}

.cs-fade-enter-from,
.cs-fade-leave-to {
  opacity: 0;
}

.cs-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.cs-modal-card {
  background: #ffffff;
  border-radius: 14px;
  width: 100%;
  max-width: 560px;
  max-height: 85vh;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: cs-slideUp 0.3s ease-out;
}

@keyframes cs-slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.cs-modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  min-height: 52px;
}

.cs-modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.cs-modal-close {
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  color: #94a3b8;
  border-radius: 7px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.cs-modal-close:hover {
  background: #f1f5f9;
  color: #475569;
}

.cs-modal-content {
  display: flex;
  flex: 1;
  min-height: 0;
}

.cs-sidebar {
  width: 130px;
  background: #f8fafc;
  border-right: 1px solid #e5e7eb;
  padding: 8px 0;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.cs-sidebar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.15s;
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
  border-left: 3px solid transparent;
}

.cs-sidebar-item:hover {
  background: #f1f5f9;
  color: #475569;
}

.cs-sidebar-item.active {
  background: #eff6ff;
  color: #3b82f6;
  border-left-color: #3b82f6;
}

.cs-sidebar-item svg {
  flex-shrink: 0;
}

.cs-modal-body {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  min-height: 0;
}

.cs-tab-content {
  animation: cs-fadeIn 0.2s ease-out;
}

@keyframes cs-fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.cs-card-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.cs-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
  color: #475569;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cs-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.cs-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: #f8fafc;
}

.cs-card-title {
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
}

.cs-card-desc {
  font-size: 12px;
  color: #64748b;
}

.cs-card-import:hover {
  border-color: #bfdbfe;
  background: #eff6ff;
}

.cs-card-import .cs-card-icon {
  background: #dbeafe;
  color: #3b82f6;
}

.cs-card-import:hover .cs-card-icon {
  background: #bfdbfe;
}

.cs-card-export:hover {
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.cs-card-export .cs-card-icon {
  background: #dcfce7;
  color: #22c55e;
}

.cs-card-export:hover .cs-card-icon {
  background: #bbf7d0;
}

.cs-card-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cs-card-trash,
.cs-card-ai {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
  color: #475569;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  justify-content: flex-start;
}

.cs-card-trash:hover {
  border-color: #fecaca;
  background: #fef2f2;
}

.cs-card-trash .cs-card-icon {
  background: #fee2e2;
  color: #ef4444;
}

.cs-card-trash:hover .cs-card-icon {
  background: #fecaca;
}

.cs-card-ai:hover {
  border-color: #fcd34d;
  background: #fefce8;
}

.cs-card-ai .cs-card-icon {
  background: #fef3c7;
  color: #d97706;
}

.cs-card-ai:hover .cs-card-icon {
  background: #fde68a;
}

.cs-card-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.cs-card-arrow {
  color: #cbd5e1;
  flex-shrink: 0;
}

.cs-card-trash:hover .cs-card-arrow,
.cs-card-ai:hover .cs-card-arrow {
  color: #94a3b8;
}

.cs-about-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cs-info-card {
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
}

.cs-info-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.cs-info-header svg {
  color: #3b82f6;
}

.cs-info-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.cs-info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cs-info-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cs-info-label {
  color: #64748b;
  font-weight: 500;
  min-width: 65px;
  font-size: 13px;
}

.cs-info-value {
  color: #1e293b;
  font-size: 13px;
  flex: 1;
}

.cs-info-code {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 11px;
  background: #e5e7eb;
  padding: 3px 8px;
  border-radius: 5px;
  word-break: break-all;
}

.cs-info-tag {
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}

.cs-info-tag-success {
  background: #dcfce7;
  color: #166534;
}

.cs-info-tag-info {
  background: #dbeafe;
  color: #1e40af;
}

.cs-info-tag-warning {
  background: #fef3c7;
  color: #92400e;
}

.cs-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px 20px;
  color: #94a3b8;
}

.cs-empty-text {
  font-size: 14px;
  color: #94a3b8;
}

.cs-shortcuts {
  gap: 10px;
}

.cs-shortcut-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cs-shortcut-label {
  font-size: 13px;
  color: #64748b;
}

.cs-shortcut-keys {
  display: flex;
  align-items: center;
  gap: 4px;
}

.cs-kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 8px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 600;
  font-family: 'Consolas', 'Monaco', monospace;
  color: #475569;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.cs-paths-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cs-path-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.cs-path-item:hover {
  background: #f8fafc;
  border-color: #d1d5db;
}

.cs-path-main {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.cs-path-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #f1f5f9;
  border-radius: 6px;
  color: #3b82f6;
  flex-shrink: 0;
}

.cs-path-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.cs-path-name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.cs-path-desc {
  font-size: 11px;
  color: #64748b;
}

.cs-path-open-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}

.cs-path-open-btn:hover {
  background: #f1f5f9;
  color: #3b82f6;
}


</style>
