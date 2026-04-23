<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

const emit = defineEmits<{
  close: [];
}>();

const shortcuts = [
  { key: 'Ctrl + F', desc: '聚焦搜索框' },
  { key: 'Ctrl + /', desc: '切换命令/脚本模式' },
  { key: 'Ctrl + N', desc: '新建命令' },
  { key: 'Escape', desc: '清空搜索框' },
];

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('close');
  }
  // Ctrl+Enter 也可关闭
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    emit('close');
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
  <div class="cs-welcome-overlay" @click.self="emit('close')">
    <div class="cs-welcome-dialog">
      <div class="cs-welcome-header">
        <div class="cs-welcome-logo">CommandSelector</div>
        <h2 class="cs-welcome-title">欢迎使用</h2>
        <p class="cs-welcome-desc">
          运维命令快捷管理工具，支持命令库、脚本管理、AI 智能补全，开箱即用。
        </p>
      </div>

      <div class="cs-welcome-body">
        <h3 class="cs-welcome-section-title">快捷键</h3>
        <div class="cs-welcome-shortcuts">
          <div
            v-for="shortcut in shortcuts"
            :key="shortcut.key"
            class="cs-welcome-shortcut"
          >
            <kbd class="cs-welcome-kbd">{{ shortcut.key }}</kbd>
            <span class="cs-welcome-shortcut-desc">{{ shortcut.desc }}</span>
          </div>
        </div>
      </div>

      <div class="cs-welcome-footer">
        <button
          class="cs-btn cs-btn-primary cs-welcome-start-btn"
          type="button"
          @click="emit('close')"
        >
          开始使用
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cs-welcome-overlay {
  position: fixed;
  inset: 0;
  background: rgba(20, 20, 19, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.cs-welcome-dialog {
  background: #faf9f5;
  border: 1px solid #f0eee6;
  border-radius: 16px;
  width: 420px;
  max-width: 90%;
  box-shadow: 0px 8px 32px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.cs-welcome-header {
  padding: 32px 32px 24px;
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.cs-welcome-logo {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  opacity: 0.85;
  margin-bottom: 12px;
}

.cs-welcome-title {
  font-family: "Georgia", serif;
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 12px;
  color: white;
}

.cs-welcome-desc {
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
  opacity: 0.9;
}

.cs-welcome-body {
  padding: 24px 32px;
}

.cs-welcome-section-title {
  font-size: 13px;
  font-weight: 600;
  color: #5e5d59;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 16px;
}

.cs-welcome-shortcuts {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cs-welcome-shortcut {
  display: flex;
  align-items: center;
  gap: 16px;
}

.cs-welcome-kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 100px;
  padding: 6px 12px;
  background: #ffffff;
  border: 1px solid #e8e6dc;
  border-radius: 8px;
  font-family: "Consolas", "Monaco", monospace;
  font-size: 12px;
  font-weight: 600;
  color: #141413;
  box-shadow: 0 2px 0 #e8e6dc;
}

.cs-welcome-shortcut-desc {
  font-size: 14px;
  color: #5e5d59;
}

.cs-welcome-footer {
  padding: 20px 32px 28px;
  display: flex;
  justify-content: center;
}

.cs-welcome-start-btn {
  height: 44px;
  padding: 0 32px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 10px;
}
</style>
