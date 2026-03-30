<script setup lang="ts">
// @ts-ignore
const APP_VERSION = __APP_VERSION__ || "1.0.0";

defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "openUrl", url: string): void;
}>();

function handleOpenGithub() {
  emit("openUrl", "https://github.com/Wtier330/CommandSelector");
}

function handleOpenIssues() {
  emit("openUrl", "https://github.com/Wtier330/CommandSelector/issues");
}

function handleOpenDocs() {
  emit("openUrl", "https://github.com/Wtier330/CommandSelector/wiki");
}
</script>

<template>
  <transition name="cs-fade">
    <div v-if="isOpen" class="cs-modal-overlay" @click.self="emit('close')">
      <div class="cs-modal-card">
        <div class="cs-modal-header">
          <h3 class="cs-modal-title">CommandSelector 项目信息</h3>
          <button class="cs-modal-close" @click="emit('close')">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="cs-modal-body">
          <div class="cs-project-header">
            <div class="cs-project-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.4c3-.6 5.8-2.6 6.2-6.2a5.7 5.7 0 0 0-.9-4.7c.3-.7.6-2.1-.3-4.3 0 0-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.9 2.6 5.8 3 5.8 3c-.9 2.2-.6 3.6-.3 4.3a5.7 5.7 0 0 0-.9 4.7c.4 3.6 3.2 5.6 6.2 6.2a4.8 4.8 0 0 0-1 3.4v4"></path>
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
              </svg>
            </div>
            <div class="cs-project-info">
              <h4 class="cs-project-name">CommandSelector</h4>
              <p class="cs-project-version">版本 v{{ APP_VERSION }}</p>
            </div>
          </div>

          <div class="cs-project-description">
            <p>CommandSelector 是一款高效的运维指令工具，帮助开发者快速生成、管理和复制常用命令。</p>
          </div>

          <div class="cs-project-features">
            <h5 class="cs-features-title">核心功能</h5>
            <ul class="cs-features-list">
              <li class="cs-feature-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>快速搜索和筛选命令</span>
              </li>
              <li class="cs-feature-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>支持参数化配置和动态替换</span>
              </li>
              <li class="cs-feature-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>分类管理和标签系统</span>
              </li>
              <li class="cs-feature-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>本地数据存储，安全可靠</span>
              </li>
            </ul>
          </div>

          <div class="cs-project-tech">
            <h5 class="cs-tech-title">技术栈</h5>
            <div class="cs-tech-tags">
              <span class="cs-tech-tag">Vue 3</span>
              <span class="cs-tech-tag">TypeScript</span>
              <span class="cs-tech-tag">Tauri</span>
              <span class="cs-tech-tag">Tailwind CSS</span>
            </div>
          </div>
        </div>

        <div class="cs-modal-footer">
          <button class="cs-modal-btn cs-modal-btn-secondary" @click="handleOpenDocs">查看文档</button>
          <button class="cs-modal-btn cs-modal-btn-primary" @click="handleOpenIssues">提反馈</button>
          <button class="cs-modal-btn cs-modal-btn-github" @click="handleOpenGithub">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23.48-.94.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
            </svg>
            GitHub
          </button>
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
  max-width: 480px;
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

.cs-project-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.cs-project-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.cs-project-info {
  flex: 1;
}

.cs-project-name {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}

.cs-project-version {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}

.cs-project-description {
  margin-bottom: 24px;
}

.cs-project-description p {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #475569;
}

.cs-project-features {
  margin-bottom: 24px;
}

.cs-features-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.cs-features-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.cs-feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  font-size: 14px;
  color: #475569;
}

.cs-feature-item svg {
  flex-shrink: 0;
  color: #3b82f6;
}

.cs-project-tech {
  margin-bottom: 0;
}

.cs-tech-title {
  margin: 0 0 10px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.cs-tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.cs-tech-tag {
  padding: 4px 10px;
  background: #f1f5f9;
  color: #475569;
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
}

.cs-modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: flex-end;
}

.cs-modal-btn {
  height: 36px;
  padding: 0 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.cs-modal-btn-secondary {
  background: #f1f5f9;
  color: #475569;
}

.cs-modal-btn-secondary:hover {
  background: #e2e8f0;
}

.cs-modal-btn-primary {
  background: #3b82f6;
  color: white;
}

.cs-modal-btn-primary:hover {
  background: #2563eb;
}

.cs-modal-btn-github {
  background: #24292f;
  color: white;
}

.cs-modal-btn-github:hover {
  background: #1b1f23;
}
</style>
