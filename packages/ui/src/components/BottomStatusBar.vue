<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAIMetadata } from '../composables/useAIMetadata';

const { isConfigured, loadProviders, providers } = useAIMetadata();

const aiStatus = ref<'loading' | 'configured' | 'not-configured'>('loading');

const aiTooltip = computed(() => {
  if (aiStatus.value === 'loading') return '正在检查 AI 配置...';
  if (aiStatus.value === 'configured') return 'AI 已配置，可使用自动生成功能';
  return 'AI 未配置，点击进行设置';
});

async function checkAIConfig() {
  aiStatus.value = 'loading';
  try {
    await loadProviders();
    if (isConfigured.value) {
      aiStatus.value = 'configured';
    } else {
      aiStatus.value = 'not-configured';
    }
  } catch (e) {
    console.error('Failed to check AI config:', e);
    aiStatus.value = 'not-configured';
  }
}

function handleSettingsClick() {
  // 触发全局事件打开设置
  window.dispatchEvent(new CustomEvent("cs-open-settings"));
}

function handleGithubClick() {
  // 触发全局事件打开项目信息
  window.dispatchEvent(new CustomEvent("cs-open-project-info"));
}

function handleAIConfigClick() {
  // 触发全局事件打开 AI 配置
  window.dispatchEvent(new CustomEvent("cs-open-ai-config"));
}


onMounted(() => {
  checkAIConfig();
  // 监听 AI 配置更新事件
  window.addEventListener("cs-ai-config-updated", checkAIConfig);
});

onUnmounted(() => {
  window.removeEventListener("cs-ai-config-updated", checkAIConfig);
});
</script>

<template>
  <div>
    <div class="cs-bottom-statusbar" data-testid="statusbar">
      <button class="cs-statusbar-btn" @click="handleSettingsClick" title="设置">
        <svg t="1774535196918" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="6470" width="16" height="16"><path d="M128 469.333333c-23.466667 0-42.666667-19.2-42.666667-42.666666V128c0-23.466667 19.2-42.666667 42.666667-42.666667h298.666667c23.466667 0 42.666667 19.2 42.666666 42.666667v298.666667c0 23.466667-19.2 42.666667-42.666666 42.666666H128z m42.666667-85.333333h213.333333V170.666667H170.666667v213.333333zM85.333333 896V597.333333c0-23.466667 19.2-42.666667 42.666667-42.666666h298.666667c23.466667 0 42.666667 19.2 42.666666 42.666666v298.666667c0 23.466667-19.2 42.666667-42.666666 42.666666H128c-23.466667 0-42.666667-19.2-42.666667-42.666667z m85.333334-42.666667h213.333333V640H170.666667v213.333333zM554.666667 896V597.333333c0-23.466667 19.2-42.666667 42.666667-42.666666h298.666667c23.466667 0 42.666667 19.2 42.666666 42.666666v298.666667c0 23.466667-19.2 42.666667-42.666666 42.666666H597.333333c-23.466667 0-42.666667-19.2-42.666667-42.666667z m85.333333-42.666667h213.333333V640H640v213.333333zM746.666667 469.333333c-106.666667 0-192-85.333333-192-192s85.333333-192 192-192 192 85.333333 192 192-85.333333 192-192 192z m0-298.666666c-59.733333 0-106.666667 46.933333-106.666667 106.666666s46.933333 106.666667 106.666667 106.666667 106.666667 106.666667 106.666667 106.666667-46.933333 106.666667 106.666667 106.666667 106.666667-106.666667-46.933333 106.666667 106.666667 106.666667-106.666667-106.666667z" fill="#1296db" p-id="6471"></path></svg>
      </button>
      <span class="cs-statusbar-text">CommandSelector - 快捷生成并复制你的运维指令</span>
      <button
        class="cs-statusbar-btn cs-statusbar-btn-ai"
        @click="handleAIConfigClick"
        :title="aiTooltip"
        :class="{
          'cs-ai-configured': aiStatus === 'configured',
          'cs-ai-not-configured': aiStatus === 'not-configured',
          'cs-ai-loading': aiStatus === 'loading'
        }"
      >
        <svg v-if="aiStatus === 'loading'" class="cs-icon-spin" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 6v6l4 2"></path>
        </svg>
        <svg v-else-if="aiStatus === 'configured'" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></path>
        </svg>
        <svg v-else viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12" y2="17"></line>
        </svg>
      </button>
      <button class="cs-statusbar-btn cs-statusbar-btn-github" @click="handleGithubClick" title="项目信息">
        <svg t="1774535325473" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="7884" width="16" height="16"><path d="M695.744 981.312H419.712c-26.816 0-47.296-21.056-47.296-48.64V739.84c0-29.184 6.336-56.768 17.344-81.088-129.28-48.64-214.528-150.72-214.528-264.256 0-53.44 17.344-103.68 50.496-147.52C213.12 204.8 209.92 151.296 213.12 89.664c3.2-27.52 23.68-46.976 48.896-46.976 14.208 0 134.08 1.6 203.52 64.832a504.384 504.384 0 0 1 184.512 0C717.888 44.288 837.696 42.688 853.504 42.688a47.36 47.36 0 0 1 47.36 45.376c4.672 61.568 0 115.072-12.672 157.248 33.152 45.44 50.496 95.68 50.496 147.52 0 113.472-85.184 215.88-214.528 264.32 11.072 25.856 17.344 53.44 17.344 81.024v192.896c1.6 27.52-20.48 50.24-45.76 50.24z m-228.672-97.28h181.376V739.84c0-27.52-12.608-53.504-33.152-71.36a48.96 48.96 0 0 1-15.744-50.24c4.736-17.856 18.944-32.384 36.288-35.648 123.008-24.32 208.192-102.144 208.192-189.696 0-46.976-25.216-82.688-45.76-105.344a47.36 47.36 0 0 1-7.872-55.168c6.336-12.928 15.808-40.512 15.808-89.152-39.488 6.464-85.184 19.456-102.528 45.44a47.552 47.552 0 0 1-50.56 19.392 393.024 393.024 0 0 0-193.92 0c-18.944 4.864-37.888-3.2-50.56-19.456-17.28-25.92-63.04-38.912-102.464-45.376 1.6 48.64 9.472 76.16 15.744 89.152a53.696 53.696 0 0 1-7.872 55.168c-20.48 22.656-45.76 58.368-45.76 105.344 0 87.552 85.184 163.776 208.256 189.696 17.28 3.2 31.552 17.792 36.224 35.648a51.008 51.008 0 0 1-15.744 50.24c-20.48 17.856-33.152 43.776-33.152 71.36v144.256h3.2z" fill="#2c2c2c" p-id="7885"></path><path d="M403.968 788.416c-212.928 0-309.12-194.56-313.92-202.688-11.008-24.32-1.536-53.44 20.48-64.832a47.424 47.424 0 0 1 63.168 21.12c3.136 6.4 80.448 157.248 241.28 149.12a46.08 46.08 0 0 1 48.896 47.04c1.6 27.52-18.88 50.24-45.696 50.24h-14.208z" fill="#2c2c2c" p-id="7886"></path></svg>
      </button>
    </div>

    <!-- SettingsModal 和 ProjectInfoModal 通过全局事件动态挂载 -->
  </div>
</template>

<style scoped>
.cs-bottom-statusbar {
  display: flex;
  align-items: center;
  height: 24px;
  background-color: var(--cs-statusbar-bg, #ffffff);
  color: var(--cs-statusbar-text, #CCCCCC);
  padding: 0;
  flex-shrink: 0;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  z-index: 40;
  width: 100%;
  bottom: 0;
  left: 0;
  border-top: 1px solid var(--cs-statusbar-border, #E5E5E5);
}

.cs-statusbar-btn {
  background: transparent;
  border: none;
  color: #CCCCCC;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0 12px;
  cursor: pointer;
  transition: color 0.2s, background-color 0.2s;
  outline: none;
}

.cs-statusbar-btn:hover {
  color: #FFFFFF;
  background-color: rgba(255, 255, 255, 0.1);
}

.cs-statusbar-text {
  font-size: 14px;
  margin-left: 8px;
  margin-right: auto;
  flex: 1;
}

.cs-statusbar-btn-github {
  margin-left: 8px;
}

/* AI 状态按钮样式 - 增强版 */
.cs-statusbar-btn-ai {
  margin-left: 8px;
  width: 40px;
  padding: 0;
  position: relative;
}

/* 未配置状态 - 警告效果 */
.cs-statusbar-btn-ai.cs-ai-not-configured {
  color: #f59e0b;
}

.cs-statusbar-btn-ai.cs-ai-not-configured::after {
  content: '';
  position: absolute;
  top: 3px;
  right: 3px;
  width: 6px;
  height: 6px;
  background: #ef4444;
  border-radius: 50%;
  animation: cs-pulse-dot 1.5s ease-in-out infinite;
}

/* 已配置状态 - 成功效果 */
.cs-statusbar-btn-ai.cs-ai-configured {
  color: #22c55e;
}

/* 加载状态 */
.cs-statusbar-btn-ai.cs-ai-loading {
  color: #6b7280;
}

/* 悬停效果 */
.cs-statusbar-btn-ai:hover {
  color: #FFFFFF;
  background-color: rgba(255, 255, 255, 0.1);
}

.cs-statusbar-btn-ai.cs-ai-not-configured:hover {
  background-color: rgba(245, 158, 11, 0.15);
}

.cs-statusbar-btn-ai.cs-ai-configured:hover {
  background-color: rgba(34, 197, 94, 0.15);
}

/* 旋转动画 */
.cs-icon-spin {
  animation: cs-spin 1s linear infinite;
}

/* 脉冲动画 */
@keyframes cs-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes cs-pulse-dot {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}
</style>
