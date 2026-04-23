<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import type { ScriptType } from "@commandselector/shared";

const emit = defineEmits<{
  (e: "close"): void;
  (e: "create", name: string, type: ScriptType, content: string): void;
}>();

const scriptName = ref("");
const scriptType = ref<ScriptType>("bat");
const errorMsg = ref("");

// 脚本类型配置 - Segment Control 风格
const typeOptions: { value: ScriptType; label: string; template: string }[] = [
  { value: 'bat', label: 'BAT', template: '@echo off\nREM 批处理脚本' },
  { value: 'ps1', label: 'PowerShell', template: '# PowerShell 脚本' },
  { value: 'vbs', label: 'VBS', template: '\' VBS 脚本\nMsgBox "Hello"' },
  { value: 'sh', label: 'Shell', template: '#!/bin/bash\n# Shell 脚本' },
  { value: 'py', label: 'Python', template: '# Python 脚本\nprint("Hello")' }
];

function handleCreate() {
  const name = scriptName.value.trim();

  if (!name) {
    errorMsg.value = "请输入脚本名称";
    return;
  }

  errorMsg.value = "";
  const typeConfig = typeOptions.find(t => t.value === scriptType.value);
  const content = typeConfig?.template || '@echo off';

  emit("create", name, scriptType.value, content);
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === "Escape") emit("close");
  else if (e.key === "Enter" && !e.shiftKey) handleCreate();
}

onMounted(() => window.addEventListener("keydown", handleKeyDown));
onUnmounted(() => window.removeEventListener("keydown", handleKeyDown));
</script>

<template>
  <teleport to="body">
    <div class="cs-dialog-overlay" @click.self="emit('close')">
      <div class="cs-dialog">
        <div class="cs-dialog-header">
          <div class="cs-dialog-title">新建脚本</div>
          <button class="cs-dialog-close" type="button" @click="emit('close')">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <div class="cs-dialog-body">
          <!-- 脚本名称 -->
          <div class="cs-form-group">
            <label class="cs-form-label">脚本名称</label>
            <input
              v-model="scriptName"
              class="cs-input"
              placeholder="例如: 部署脚本"
              @keyup.enter="handleCreate"
            />
            <div v-if="errorMsg" class="cs-error-text">{{ errorMsg }}</div>
          </div>

          <!-- 脚本类型 - Segment Control -->
          <div class="cs-form-group">
            <label class="cs-form-label">脚本类型</label>
            <div class="cs-segment-control">
              <button
                v-for="opt in typeOptions"
                :key="opt.value"
                type="button"
                class="cs-segment-btn"
                :class="{ active: scriptType === opt.value }"
                @click="scriptType = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>

        </div>

        <div class="cs-dialog-footer">
          <button class="cs-btn cs-btn-outline" type="button" @click="emit('close')">取消</button>
          <button class="cs-btn cs-btn-primary" type="button" @click="handleCreate">创建</button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
.cs-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.cs-dialog {
  background: white;
  border-radius: 16px;
  width: 480px;
  max-width: 90%;
  display: flex;
  flex-direction: column;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 10px 25px -5px rgba(0, 0, 0, 0.15),
    0 20px 48px -12px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.cs-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0eee6;
}

.cs-dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: #141413;
}

.cs-dialog-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.cs-dialog-close:hover {
  background: #f3f4f6;
  color: #374151;
}

.cs-dialog-body {
  padding: 24px;
}

.cs-form-group {
  margin-bottom: 24px;
}

.cs-form-group:last-child {
  margin-bottom: 0;
}

.cs-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.cs-form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 10px;
}

.cs-label-row .cs-form-label {
  margin-bottom: 0;
}

.cs-input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  color: #141413;
  background: #faf9f5;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.cs-input:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.cs-input::placeholder {
  color: #9ca3af;
}

.cs-textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
  line-height: 1.5;
}

.cs-error-text {
  margin-top: 8px;
  font-size: 13px;
  color: #dc2626;
}

/* Segment Control */
.cs-segment-control {
  display: flex;
  background: #f3f4f6;
  border-radius: 10px;
  padding: 4px;
  gap: 4px;
}

.cs-segment-btn {
  flex: 1;
  padding: 10px 12px;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.cs-segment-btn:hover:not(.active) {
  color: #374151;
  background: rgba(255, 255, 255, 0.5);
}

.cs-segment-btn.active {
  background: white;
  color: #141413;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.05),
    0 1px 3px rgba(0, 0, 0, 0.1);
}

/* AI 按钮 */
.cs-ai-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border: 1px solid #e9d5ff;
  background: #faf5ff;
  color: #7c3aed;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.cs-ai-btn:hover {
  background: #f3e8ff;
  border-color: #c4b5fd;
}

.cs-ai-btn span:first-child {
  font-size: 14px;
}

.cs-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #f0eee6;
  background: #faf9f5;
}

.cs-btn {
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid;
  transition: all 0.2s ease;
}

.cs-btn-outline {
  background: white;
  color: #6b7280;
  border-color: #e5e7eb;
}

.cs-btn-outline:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  color: #374151;
}

.cs-btn-primary {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border-color: transparent;
  box-shadow:
    0 1px 2px rgba(99, 102, 241, 0.2),
    0 4px 12px rgba(99, 102, 241, 0.25);
}

.cs-btn-primary:hover {
  background: linear-gradient(135deg, #5558e3 0%, #7c3aed 100%);
  box-shadow:
    0 2px 4px rgba(99, 102, 241, 0.3),
    0 6px 16px rgba(99, 102, 241, 0.35);
  transform: translateY(-1px);
}
</style>
