<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import type { ScriptType } from "@commandselector/shared";

const emit = defineEmits<{
  (e: "close"): void;
  (e: "create", name: string, type: ScriptType, content: string, description?: string): void;
}>();

const scriptName = ref("");
const scriptType = ref<ScriptType>("bat");
const scriptDescription = ref("");
const errorMsg = ref("");

function handleCreate() {
  const name = scriptName.value.trim();

  if (!name) {
    errorMsg.value = "请输入脚本名称";
    return;
  }

  errorMsg.value = "";
  const content = scriptType.value === "bat"
    ? "@echo off\nREM 批处理脚本"
    : "# PowerShell 脚本";

  emit("create", name, scriptType.value, content, scriptDescription.value.trim() || undefined);
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === "Escape") emit("close");
  else if (e.key === "Enter") handleCreate();
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
          <button class="cs-dialog-close" type="button" @click="emit('close')">&times;</button>
        </div>

        <div class="cs-dialog-body">
          <div class="cs-form-group">
            <label class="cs-form-label">脚本名称</label>
            <input v-model="scriptName" class="cs-input" placeholder="例如: 部署脚本" @keyup.enter="handleCreate" />
            <div v-if="errorMsg" class="cs-error-text">{{ errorMsg }}</div>
          </div>

          <div class="cs-form-group">
            <label class="cs-form-label">脚本类型</label>
            <div class="cs-type-selector">
              <label class="cs-type-option" :class="{ active: scriptType === 'bat' }">
                <input type="radio" v-model="scriptType" value="bat" />
                <span>批处理</span>
              </label>
              <label class="cs-type-option" :class="{ active: scriptType === 'ps1' }">
                <input type="radio" v-model="scriptType" value="ps1" />
                <span>PowerShell</span>
              </label>
            </div>
          </div>

          <div class="cs-form-group">
            <label class="cs-form-label">描述</label>
            <textarea v-model="scriptDescription" class="cs-input cs-textarea" placeholder="脚本的功能描述（可选）" rows="2"></textarea>
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
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.cs-dialog {
  background: white;
  border-radius: 8px;
  width: 480px;
  max-width: 90%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.cs-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.cs-dialog-title {
  font-size: 16px;
  font-weight: 600;
}

.cs-dialog-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
  border-radius: 4px;
}

.cs-dialog-close:hover {
  background: #f3f4f6;
}

.cs-dialog-body {
  padding: 20px;
}

.cs-form-group {
  margin-bottom: 16px;
}

.cs-form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
}

.cs-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}

.cs-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.cs-textarea {
  resize: vertical;
  min-height: 60px;
}

.cs-error-text {
  margin-top: 6px;
  font-size: 13px;
  color: #dc2626;
}

.cs-type-selector {
  display: flex;
  gap: 12px;
}

.cs-type-option {
  flex: 1;
  padding: 12px;
  border: 2x solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.cs-type-option.active {
  border-color: #3b82f6;
  background: #eff6ff;
}

.cs-type-option input {
  display: none;
}

.cs-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
}

.cs-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid;
}

.cs-btn-primary {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.cs-btn-primary:hover {
  background: #2563eb;
  border-color: #2563eb;
}

.cs-btn-outline {
  background: white;
  color: #374151;
  border-color: #d1d5db;
}

.cs-btn-outline:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}
</style>
