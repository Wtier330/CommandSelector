<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  type AIProviderConfig,
  type AIProvider,
  aiConfigManager
} from '../utils/aiConfig';
import { useAIMetadata } from '../composables/useAIMetadata';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
  save: [];
}>();

const {
  providers,
  defaultProviderId,
  error,
  addProvider,
  updateProvider,
  deleteProvider,
  setDefaultProvider,
  testConnection,
  clearError,
  loadProviders,
  getDefaultModel,
} = useAIMetadata();

// 编辑状态
const editingProviderId = ref<string | null>(null);
const isTesting = ref(false);
const testResult = ref<{ success: boolean; message: string } | null>(null);

// 编辑表单
const editForm = ref<AIProviderConfig>({
  id: '',
  name: '',
  provider: 'anthropic',
  apiKey: '',
  model: '',
  temperature: 0.7,
  maxTokens: 1000,
});

// 是否为新建模式
const isCreating = computed(() => {
  return editingProviderId.value === 'new';
});

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.isOpen) {
    if (editingProviderId.value) {
      closeEditDialog();
    } else {
      emit('close');
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
  loadProviders();
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});

// 打开新建对话框
function openCreateDialog() {
  editingProviderId.value = 'new';
  editForm.value = {
    id: '',
    name: '',
    provider: 'anthropic',
    apiKey: '',
    model: getDefaultModel('anthropic'),
    temperature: 0.7,
    maxTokens: 1000,
  };
  clearError();
  testResult.value = null;
}

// 打开编辑对话框
function openEditDialog(provider: AIProviderConfig) {
  editingProviderId.value = provider.id;
  editForm.value = { ...provider };
  clearError();
  testResult.value = null;
}

function closeEditDialog() {
  editingProviderId.value = null;
  clearError();
  testResult.value = null;
}

// 添加新提供商
function handleAddProvider() {
  const validation = addProvider({
    ...editForm.value,
    id: aiConfigManager.generateId()
  });
  if (validation.valid) {
    closeEditDialog();
  } else {
    alert(validation.error);
  }
}

// 更新提供商
function handleUpdateProvider() {
  if (!editingProviderId.value || editingProviderId.value === 'new') return;
  const { id, ...updates } = editForm.value;
  const validation = updateProvider(id, updates);
  if (validation.valid) {
    closeEditDialog();
  } else {
    alert(validation.error);
  }
}

// 删除提供商
function handleDeleteProvider(id: string, name: string) {
  if (confirm(`确定要删除"${name}"吗？`)) {
    deleteProvider(id);
  }
}

// 设为默认
function handleSetDefault(id: string) {
  setDefaultProvider(id);
}

// 测试连接
async function handleTestConnection() {
  clearError();
  testResult.value = null;
  isTesting.value = true;

  const success = await testConnection(editForm.value);
  isTesting.value = false;
  testResult.value = {
    success,
    message: success ? '连接测试成功！' : '连接测试失败'
  };
}

// 获取提供商类型名称
function getProviderTypeName(type: AIProvider): string {
  const names: Record<string, string> = {
    anthropic: 'Anthropic Claude',
    openai: 'OpenAI GPT',
    openrouter: 'OpenRouter',
    custom: '自定义',
  };
  return names[type];
}

// 获取图标
function getProviderIcon(type: AIProvider): string {
  if (type === 'anthropic') return '🤖';
  if (type === 'openai') return '🧠';
  if (type === 'openrouter') return '🌐';
  return '⚙️';
}
</script>

<template>
  <teleport to="body">
    <transition name="cs-ai-config-fade">
      <div v-if="isOpen" class="cs-ai-config-overlay" @click.self="emit('close')">
        <div class="cs-ai-config-dialog">
          <!-- 头部 -->
          <div class="cs-ai-config-header">
            <h3>AI 服务提供商管理</h3>
            <button class="cs-ai-config-close" @click="emit('close')">✕</button>
          </div>

          <!-- 提供商列表 -->
          <div class="cs-ai-config-body">
            <div v-if="providers.length === 0" class="cs-ai-config-empty">
              <div class="cs-ai-config-empty-icon">🤖</div>
              <p>还没有配置任何 AI 服务提供商</p>
              <button class="cs-ai-config-btn-primary" @click="openCreateDialog">
                添加提供商
              </button>
            </div>

            <div v-else class="cs-ai-config-list">
              <div
                v-for="provider in providers"
                :key="provider.id"
                class="cs-ai-config-item"
                :class="{ 'is-default': provider.id === defaultProviderId }"
              >
                <div class="cs-ai-config-item-header">
                  <span class="cs-ai-config-item-icon">{{ getProviderIcon(provider.provider) }}</span>
                  <span class="cs-ai-config-item-name">{{ provider.name }}</span>
                  <span v-if="provider.id === defaultProviderId" class="cs-ai-config-item-default">
                    默认
                  </span>
                </div>
                <div class="cs-ai-config-item-info">
                  <span>{{ getProviderTypeName(provider.provider) }}</span>
                  <span>•</span>
                  <span>{{ provider.model }}</span>
                </div>
                <div class="cs-ai-config-item-actions">
                  <button
                    v-if="provider.id !== defaultProviderId"
                    class="cs-ai-config-item-btn"
                    title="设为默认"
                    @click="handleSetDefault(provider.id)"
                  >
                    ⭐
                  </button>
                  <button
                    class="cs-ai-config-item-btn"
                    title="编辑"
                    @click="openEditDialog(provider)"
                  >
                    ✏️
                  </button>
                  <button
                    class="cs-ai-config-item-btn"
                    title="删除"
                    @click="handleDeleteProvider(provider.id, provider.name)"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>

            <button
              v-if="providers.length > 0"
              class="cs-ai-config-add-btn"
              @click="openCreateDialog"
            >
              <span>＋</span>
              <span>添加提供商</span>
            </button>
          </div>
        </div>

        <!-- 编辑对话框 -->
        <transition name="cs-ai-edit-fade">
          <div v-if="editingProviderId" class="cs-ai-edit-overlay">
            <div class="cs-ai-edit-dialog">
              <div class="cs-ai-edit-header">
                <h4>{{ isCreating ? '添加提供商' : '编辑提供商' }}</h4>
                <button class="cs-ai-edit-close" @click="closeEditDialog">✕</button>
              </div>

              <div class="cs-ai-edit-body">
                <div class="cs-ai-edit-group">
                  <label>名称</label>
                  <input
                    v-model="editForm.name"
                    type="text"
                    class="cs-ai-edit-input"
                    placeholder="例如：我的 Claude"
                  />
                </div>

                <div class="cs-ai-edit-group">
                  <label>提供商类型</label>
                  <select v-model="editForm.provider" class="cs-ai-edit-input">
                    <option value="anthropic">Anthropic Claude</option>
                    <option value="openai">OpenAI GPT</option>
                    <option value="openrouter">OpenRouter</option>
                    <option value="custom">自定义</option>
                  </select>
                </div>

                <div class="cs-ai-edit-group">
                  <label>API Key</label>
                  <input
                    v-model="editForm.apiKey"
                    type="password"
                    class="cs-ai-edit-input"
                    placeholder="输入 API Key"
                  />
                </div>

                <div class="cs-ai-edit-group">
                  <label>模型</label>
                  <input
                    v-model="editForm.model"
                    type="text"
                    class="cs-ai-edit-input"
                    :placeholder="getDefaultModel(editForm.provider)"
                  />
                </div>

                <div v-if="editForm.provider === 'custom'" class="cs-ai-edit-group">
                  <label>API Base URL</label>
                  <input
                    v-model="editForm.customEndpoint"
                    type="text"
                    class="cs-ai-edit-input"
                    placeholder="如火山引擎: https://ark.cn-beijing.volces.com/api/v3"
                  />
                  <p class="cs-ai-edit-hint">兼容 OpenAI API 格式的服务，填写 base_url 即可</p>
                </div>

                <div class="cs-ai-edit-row">
                  <div class="cs-ai-edit-group">
                    <label>温度 (0-1)</label>
                    <input
                      v-model.number="editForm.temperature"
                      type="number"
                      class="cs-ai-edit-input"
                      min="0"
                      max="1"
                      step="0.1"
                    />
                  </div>
                  <div class="cs-ai-edit-group">
                    <label>最大 Tokens</label>
                    <input
                      v-model.number="editForm.maxTokens"
                      type="number"
                      class="cs-ai-edit-input"
                      min="1" max="10000" step="100"
                    />
                  </div>
                </div>

                <div v-if="error" class="cs-ai-edit-error">
                  {{ error.message }}
                </div>

                <div v-if="testResult" class="cs-ai-edit-result" :class="testResult.success ? 'success' : 'error'">
                  {{ testResult.message }}
                </div>
              </div>

              <div class="cs-ai-edit-footer">
                <button
                  class="cs-ai-edit-btn cs-ai-edit-btn-test"
                  :disabled="isTesting"
                  @click="handleTestConnection"
                >
                  {{ isTesting ? '测试中...' : '测试连接' }}
                </button>
                <button class="cs-ai-edit-btn" @click="closeEditDialog">
                  取消
                </button>
                <button
                  class="cs-ai-edit-btn cs-ai-edit-btn-save"
                  @click="isCreating ? handleAddProvider() : handleUpdateProvider()"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </teleport>
</template>

<style scoped>
.cs-ai-config-fade-enter-active,
.cs-ai-config-fade-leave-active {
  transition: opacity 0.2s ease;
}
.cs-ai-config-fade-enter-from,
.cs-ai-config-fade-leave-to {
  opacity: 0;
}

.cs-ai-edit-fade-enter-active,
.cs-ai-edit-fade-leave-active {
  transition: all 0.2s ease;
}
.cs-ai-edit-fade-enter-from,
.cs-ai-edit-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.cs-ai-config-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4000;
}

.cs-ai-config-dialog {
  background: white;
  border-radius: 12px;
  width: 500px;
  max-width: 90%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.cs-ai-config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.cs-ai-config-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.cs-ai-config-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #6b7280;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.cs-ai-config-close:hover {
  background: #f3f4f6;
  color: #111827;
}

.cs-ai-config-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.cs-ai-config-empty {
  text-align: center;
  padding: 60px 20px;
}

.cs-ai-config-empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.cs-ai-config-empty p {
  color: #6b7280;
  margin-bottom: 24px;
}

.cs-ai-config-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.cs-ai-config-item {
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  transition: all 0.2s;
}

.cs-ai-config-item.is-default {
  border-color: #3b82f6;
  background: #eff6ff;
}

.cs-ai-config-item:hover {
  border-color: #d1d5db;
}

.cs-ai-config-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.cs-ai-config-item-icon {
  font-size: 20px;
}

.cs-ai-config-item-name {
  font-weight: 600;
  font-size: 15px;
  flex: 1;
}

.cs-ai-config-item-default {
  padding: 2px 8px;
  background: #3b82f6;
  color: white;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.cs-ai-config-item-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b72828;
  font-size: 13px;
  margin-bottom: 12px;
}

.cs-ai-config-item-actions {
  display: flex;
  gap: 8px;
}

.cs-ai-config-item-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.15s;
}

.cs-ai-config-item-btn:hover {
  background: #f3f4f6;
}

.cs-ai-config-add-btn {
  width: 100%;
  padding: 12px;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  background: #f9fafb;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.cs-ai-config-add-btn:hover {
  border-color: #9ca3af;
  background: #f3f4f6;
}

/* 编辑对话框 */
.cs-ai-edit-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4100;
}

.cs-ai-edit-dialog {
  background: white;
  border-radius: 12px;
  width: 450px;
  max-width: 90%;
  display: flex;
  flex-direction: column;
}

.cs-ai-edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.cs-ai-edit-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.cs-ai-edit-close {
  background: none;
  border: none;
  font-size: 18px;
  color: #6b7280;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.cs-ai-edit-close:hover {
  background: #f3f4f6;
  color: #111827;
}

.cs-ai-edit-body {
  padding: 16px 20px;
  overflow-y: auto;
  max-height: 60vh;
}

.cs-ai-edit-group {
  margin-bottom: 16px;
}

.cs-ai-edit-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.cs-ai-edit-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}

.cs-ai-edit-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.cs-ai-edit-hint {
  margin-top: 6px;
  font-size: 12px;
  color: #6b7280;
}

.cs-ai-edit-row {
  display: flex;
  gap: 12px;
}

.cs-ai-edit-row .cs-ai-edit-group {
  flex: 1;
}

.cs-ai-edit-error {
  margin-top: 12px;
  padding: 10px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  font-size: 13px;
  color: #dc2626;
}

.cs-ai-edit-result {
  margin-top: 12px;
  padding: 10px;
  border-radius: 6px;
  font-size: 13px;
}

.cs-ai-edit-result.success {
  background: #f0fdf4;
  border: 1px solid #86efac;
  color: #16a34a;
}

.cs-ai-edit-result.error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
}

.cs-ai-edit-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid #e5e7eb;
}

.cs-ai-edit-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  transition: all 0.15s;
}

.cs-ai-edit-btn:hover:not(:disabled) {
  background: #f9fafb;
}

.cs-ai-edit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cs-ai-edit-btn-test {
  border-color: #3b82f6;
  color: #3b82f6;
  margin-right: auto;
}

.cs-ai-edit-btn-test:hover:not(:disabled) {
  background: #eff6ff;
}

.cs-ai-edit-btn-save {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.cs-ai-edit-btn-save:hover:not(:disabled) {
  background: #2563eb;
}

.cs-ai-config-btn-primary {
  padding: 10px 24px;
  border-radius: 8px;
  background: #3b82f6;
  color: white;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cs-ai-config-btn-primary:hover {
  background: #2563eb;
}
</style>
