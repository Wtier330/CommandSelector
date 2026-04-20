<script setup lang="ts">
import { defineProps, defineEmits, onMounted, onUnmounted } from "vue";

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

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
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

        <div class="cs-modal-body">
          <div class="cs-settings-section">
            <h4 class="cs-settings-title">配置管理</h4>
            <p class="cs-settings-desc">导入或导出命令库配置文件，用于备份或在不同设备间同步命令。</p>

            <div class="cs-settings-actions">
              <button class="cs-settings-btn cs-settings-btn-import" @click="handleImport">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>导入配置</span>
              </button>

              <button class="cs-settings-btn cs-settings-btn-export" @click="handleExport">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <span>导出配置</span>
              </button>
            </div>
          </div>

          <div class="cs-settings-section">
            <h4 class="cs-settings-title">回收站</h4>
            <p class="cs-settings-desc">查看被删除的命令，支持恢复或彻底删除。</p>

            <button class="cs-settings-btn cs-settings-btn-trash" @click="handleOpenTrash">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1 -1 2 -2 2H7c-1 0 -2 -1 -2 -2V6"></path>
                <path d="M8 6V4c0 -1 1 -2 2 -2h4c1 0 2 1 2 2v2"></path>
              </svg>
              <span>打开回收站</span>
            </button>
          </div>

          <div class="cs-settings-section">
            <h4 class="cs-settings-title">AI 功能</h4>
            <p class="cs-settings-desc">配置 AI 服务用于自动生成脚本元数据。</p>

            <button class="cs-settings-btn cs-settings-btn-ai" @click="handleOpenAIConfig">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"></path>
              </svg>
              <span>AI 配置</span>
            </button>
          </div>

          <div v-if="librarySource" class="cs-settings-section">
            <h4 class="cs-settings-title">数据源信息</h4>
            <p class="cs-settings-desc">查看当前命令库的加载源信息。</p>

            <div class="cs-info-list">
              <div class="cs-info-item">
                <span class="cs-info-label">数据源类型：</span>
                <span class="cs-info-value">
                  <span v-if="librarySource.includes('AppLocalData')" class="cs-tag cs-success-tag">本地文件</span>
                  <span v-else-if="librarySource.includes('localStorage')" class="cs-tag cs-info-tag">浏览器存储</span>
                  <span v-else-if="librarySource.includes('/library.json')" class="cs-tag cs-warning-tag">应用默认</span>
                  <span v-else class="cs-tag">其他</span>
                </span>
              </div>
              <div class="cs-info-item">
                <span class="cs-info-label">加载路径：</span>
                <span class="cs-info-value cs-code">{{ librarySource }}</span>
              </div>
              <div v-if="commandCount !== undefined" class="cs-info-item">
                <span class="cs-info-label">命令数量：</span>
                <span class="cs-info-value">{{ commandCount }} 条</span>
              </div>
              <div v-if="lastUpdateTime" class="cs-info-item">
                <span class="cs-info-label">最后更新：</span>
                <span class="cs-info-value">{{ new Date(lastUpdateTime).toLocaleString('zh-CN') }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="cs-modal-footer">
          <button class="cs-modal-btn" @click="emit('close')">关闭</button>
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
  border-radius: 12px;
  width: 100%;
  max-width: 480px;
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
  padding: 14px 18px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  min-height: 48px;
}

.cs-modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.cs-modal-close {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: #94a3b8;
  border-radius: 6px;
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

.cs-modal-body {
  padding: 16px 18px;
  overflow-y: auto;
  flex: 1;
}

.cs-settings-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 18px;
}

.cs-settings-section:last-child {
  margin-bottom: 0;
}

.cs-settings-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.cs-settings-desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: #64748b;
}

.cs-settings-actions {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}

.cs-settings-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 12px;
  border: 2px solid transparent;
  border-radius: 10px;
  background: #f8fafc;
  color: #475569;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.cs-settings-btn:hover {
  background: #f1f5f9;
  border-color: #e2e8f0;
}

.cs-settings-btn-import:hover {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #3b82f6;
}

.cs-settings-btn-export:hover {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #22c55e;
}

.cs-settings-btn-trash {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 12px;
  border: 2px solid transparent;
  border-radius: 10px;
  background: #fef3c7;
  color: #b91c1c;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.cs-settings-btn-trash:hover {
  background: #fee2e2;
  border-color: #fecaca;
  color: #ef4444;
}

.cs-settings-btn-ai:hover {
  background: #fef3c7;
  border-color: #fcd34d;
  color: #d97706;
}

.cs-settings-btn svg {
  flex-shrink: 0;
}

.cs-info-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
}

.cs-info-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.cs-info-label {
  color: #6b7280;
  font-weight: 500;
  min-width: 75px;
  flex-shrink: 0;
  font-size: 13px;
}

.cs-info-value {
  color: #1e293b;
  font-size: 13px;
  flex: 1;
  word-break: break-all;
}

.cs-info-value.cs-code {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  background: #f1f5f9;
  padding: 3px 6px;
  border-radius: 4px;
}

.cs-tag {
  padding: 3px 8px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 500;
}

.cs-success-tag {
  background: #dcfce7;
  color: #166534;
}

.cs-info-tag {
  background: #dbeafe;
  color: #1e40af;
}

.cs-warning-tag {
  background: #fef3c7;
  color: #92400e;
}

.cs-modal-footer {
  padding: 12px 18px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
}

.cs-modal-btn {
  padding: 7px 18px;
  background: #f1f5f9;
  color: #475569;
  border: none;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.cs-modal-btn:hover {
  background: #e2e8f0;
}
</style>
