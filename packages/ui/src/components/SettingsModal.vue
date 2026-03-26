<script setup lang="ts">
import { defineProps, defineEmits } from "vue";

defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "import"): void;
  (e: "export"): void;
  (e: "openTrash"): void;
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
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>导入配置</span>
              </button>

              <button class="cs-settings-btn cs-settings-btn-export" @click="handleExport">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1 -1 2 -2 2H7c-1 0 -2 -1 -2 -2V6"></path>
                <path d="M8 6V4c0 -1 1 -2 2 -2h4c1 0 2 1 2 2v2"></path>
              </svg>
              <span>打开回收站</span>
            </button>
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
  border-radius: 16px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
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
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cs-modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.cs-modal-close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #94a3b8;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.cs-modal-close:hover {
  background: #f1f5f9;
  color: #475569;
}

.cs-modal-body {
  padding: 24px;
}

.cs-settings-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cs-settings-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.cs-settings-desc {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #64748b;
}

.cs-settings-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.cs-settings-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 16px;
  border: 2px solid transparent;
  border-radius: 12px;
  background: #f8fafc;
  color: #475569;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
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
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 16px;
  border: 2px solid transparent;
  border-radius: 12px;
  background: #fef3c7;
  color: #b91c1c;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cs-settings-btn-trash:hover {
  background: #fee2e2;
  border-color: #fecaca;
  color: #ef4444;
}

.cs-settings-btn svg {
  flex-shrink: 0;
}

.cs-modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.cs-modal-btn {
  padding: 8px 20px;
  background: #f1f5f9;
  color: #475569;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cs-modal-btn:hover {
  background: #e2e8f0;
}
</style>
