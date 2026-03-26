<script setup lang="ts">
import { ref, watch } from "vue";
import { useCommandFormat } from "../composables/useCommandFormat";

const props = defineProps<{
  finalCommand: string;
  canCopy: boolean;
  validationOk: boolean;
  validationReasons: string[];
}>();

const emit = defineEmits<{
  (e: "copy"): void;
}>();

const finalCommandRef = ref(props.finalCommand);
const { execMode, runAsAdmin, silentMode, formattedCommand, modeLabels, modeDescriptions } = useCommandFormat(finalCommandRef);

// 接收 props 中的 finalCommand 并传递给 ref
watch(() => props.finalCommand, (val) => {
  finalCommandRef.value = val;
}, { immediate: true });

async function handleCopy() {
  if (!props.canCopy) return;
  try {
    await navigator.clipboard.writeText(formattedCommand.value);
    emit("copy");
  } catch {
    // 复制失败，静默处理
  }
}
</script>

<template>
  <div class="cs-preview-wrap" style="flex: 1; display: flex; flex-direction: column; min-height: 0;">
    <div class="cs-preview-header">
      <h2 class="cs-section-title-text">最终命令预览</h2>
      <button class="cs-btn cs-copy-btn-outline" type="button" :disabled="!canCopy" @click.stop="handleCopy()">
        复制
      </button>
    </div>

    <!-- 命令执行方式选择器 -->
    <div class="cs-exec-mode-selector">
      <button
        v-for="mode in ['cmd', 'powershell', 'cmd2powershell'] as const"
        :key="mode"
        class="cs-exec-mode-btn"
        :class="{ 'is-active': execMode === mode }"
        type="button"
        @click="execMode = mode"
      >
        <span class="cs-exec-mode-label">{{ modeLabels[mode] }}</span>
        <span class="cs-exec-mode-desc">{{ modeDescriptions[mode] }}</span>
      </button>
    </div>

    <!-- CMD→PS 执行选项 -->
    <div v-if="execMode === 'cmd2powershell'" class="cs-exec-options">
      <label class="cs-checkbox-option">
        <input type="checkbox" v-model="runAsAdmin" class="cs-checkbox-input" />
        <span class="cs-checkbox-label">提权执行</span>
        <span class="cs-checkbox-hint">使用管理员权限运行</span>
      </label>
      <label class="cs-checkbox-option">
        <input type="checkbox" v-model="silentMode" class="cs-checkbox-input" />
        <span class="cs-checkbox-label">静默执行</span>
        <span class="cs-checkbox-hint">隐藏 PowerShell 窗口</span>
      </label>
    </div>

    <div class="cs-code-wrap">
      <div class="cs-code-container">
        <pre
          class="cs-code cs-code-clickable"
          role="button"
          tabindex="0"
          @click="handleCopy()"
          @keydown.enter.prevent="handleCopy()"
          @keydown.space.prevent="handleCopy()"
        ><code>{{ formattedCommand }}</code></pre>
      </div>
      <div v-if="!validationOk" class="cs-alert">
        {{ validationReasons.join("；") }}
      </div>
    </div>
  </div>
</template>

<style scoped>
@import "../styles/command-detail.css";
</style>
