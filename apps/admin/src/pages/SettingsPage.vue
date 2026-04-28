<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import {
  NCard, NSpace, NText, NTag, NPageHeader,
  NSwitch, NButton, NSelect, NForm, NFormItem
} from "naive-ui";
import { useLibraryStore } from "../store/library";
import { invoke } from "@tauri-apps/api/core";

const router = useRouter();
type TagType = "default" | "success" | "info" | "warning" | "error";

const { librarySource, lastUpdateTime, commands } = useLibraryStore();

// 全局快捷键设置
interface HotkeyConfig {
  enabled: boolean;
  modifiers: number;
  virtualKey: number;
  displayName: string;
}

const hotkeyEnabled = ref(true);
const hotkeyDisplay = ref("Alt + C");
const hotkeyConfig = ref<HotkeyConfig | null>(null);

// 修饰键选项
const modifierOptions = [
  { label: "Alt", value: 1 },
  { label: "Ctrl", value: 2 },
  { label: "Shift", value: 4 },
  { label: "Alt + Ctrl", value: 3 },
  { label: "Alt + Shift", value: 5 },
  { label: "Ctrl + Shift", value: 6 },
];

// 字母键选项
const keyOptions = Array.from({ length: 26 }, (_, i) => ({
  label: String.fromCharCode(65 + i),
  value: 65 + i,
}));

// 当前选择的修饰键和键
const selectedModifiers = ref(1);
const selectedKey = ref(67); // C

// 格式化时间
const formattedUpdateTime = computed(() => {
  if (!lastUpdateTime.value) return "未加载";
  return new Date(lastUpdateTime.value).toLocaleString("zh-CN");
});

// 判断数据源类型
const sourceType = computed(() => {
  if (!librarySource.value) return { label: "未知", type: "default" as TagType };
  if (librarySource.value.includes("AppLocalData")) return { label: "本地文件", type: "success" as TagType };
  if (librarySource.value.includes("localStorage")) return { label: "浏览器存储", type: "info" as TagType };
  if (librarySource.value.includes("/library.json")) return { label: "应用默认", type: "warning" as TagType };
  return { label: "其他", type: "default" as TagType };
});

// 更新快捷键显示名称
function updateHotkeyDisplay() {
  const modifier = modifierOptions.find((m: any) => m.value === selectedModifiers.value);
  const key = keyOptions.find((k: any) => k.value === selectedKey.value);
  hotkeyDisplay.value = `${modifier?.label || ''} + ${key?.label || ''}`;
}

// 加载默认快捷键配置
async function loadDefaultHotkey() {
  try {
    const config = await invoke<HotkeyConfig>("get_default_hotkey");
    hotkeyConfig.value = config;
    hotkeyEnabled.value = config.enabled;
    selectedModifiers.value = config.modifiers;
    selectedKey.value = config.virtualKey;
    updateHotkeyDisplay();
  } catch (error) {
    console.error("加载快捷键配置失败:", error);
  }
}

// 注册快捷键
async function registerHotkey() {
  try {
    const success = await invoke<boolean>("register_global_hotkey", {
      modifiers: selectedModifiers.value,
      vk: selectedKey.value,
    });
    if (success) {
      alert("快捷键注册成功！");
    }
  } catch (error) {
    alert("快捷键注册失败：" + (error as Error).message);
  }
}

// 注销快捷键
async function unregisterHotkey() {
  try {
    const success = await invoke<boolean>("unregister_global_hotkey");
    if (success) {
      alert("快捷键已注销");
    }
  } catch (error) {
    alert("快捷键注销失败：" + (error as Error).message);
  }
}

// 应用快捷键设置
async function applyHotkeySettings() {
  if (hotkeyEnabled.value) {
    await registerHotkey();
  } else {
    await unregisterHotkey();
  }
}

// 测试快捷键
async function testHotkey() {
  try {
    await invoke("toggle_window_visibility");
  } catch (error) {
    alert("测试失败：" + (error as Error).message);
  }
}

function handleBack() {
  router.push("/");
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === "Escape") {
    handleBack();
  }
}

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
  loadDefaultHotkey();
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
});
</script>

<template>
  <div>
    <n-page-header
      title="系统设置"
      subtitle="查看和管理系统配置信息"
      @back="handleBack"
    />
    <n-space vertical size="large">
      <!-- 全局快捷键设置 -->
      <n-card title="全局快捷键" size="small">
        <n-space vertical>
          <div class="info-row">
            <span class="info-label">启用快捷键：</span>
            <n-switch v-model:value="hotkeyEnabled" />
          </div>
          <div v-if="hotkeyEnabled">
            <div class="info-row">
              <span class="info-label">当前快捷键：</span>
              <n-tag type="success" size="small">{{ hotkeyDisplay }}</n-tag>
            </div>
            <n-form label-placement="left" label-width="120">
              <n-form-item label="修饰键：">
                <n-select
                  v-model:value="selectedModifiers"
                  :options="modifierOptions"
                  style="width: 200px"
                  @update:value="updateHotkeyDisplay"
                />
              </n-form-item>
              <n-form-item label="字母键：">
                <n-select
                  v-model:value="selectedKey"
                  :options="keyOptions"
                  style="width: 200px"
                  @update:value="updateHotkeyDisplay"
                />
              </n-form-item>
            </n-form>
            <n-space>
              <n-button type="primary" @click="applyHotkeySettings">
                应用设置
              </n-button>
              <n-button @click="testHotkey">
                测试显示/隐藏
              </n-button>
            </n-space>
          </div>
          <div class="hint">
            <n-text depth="3" style="font-size: 12px;">
              提示：设置快捷键后，在任意地方按下快捷键可以快速显示或隐藏应用窗口。
            </n-text>
          </div>
        </n-space>
      </n-card>

      <!-- 数据源信息 -->
      <n-card title="数据源信息" size="small">
        <n-space vertical>
          <div class="info-row">
            <span class="info-label">数据源类型：</span>
            <n-tag :type="sourceType.type" size="small">{{ sourceType.label }}</n-tag>
          </div>
          <div class="info-row">
            <span class="info-label">加载路径：</span>
            <n-text code>{{ librarySource || "未加载" }}</n-text>
          </div>
          <div class="info-row">
            <span class="info-label">命令数量：</span>
            <n-text>{{ commands.length }} 条</n-text>
          </div>
          <div class="info-row">
            <span class="info-label">最后更新：</span>
            <n-text>{{ formattedUpdateTime }}</n-text>
          </div>
        </n-space>
      </n-card>
    </n-space>
  </div>
</template>

<style scoped>
.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-label {
  color: #6b7280;
  font-weight: 500;
  min-width: 100px;
}

.hint {
  margin-top: 12px;
}
</style>