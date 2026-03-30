<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { CommandEntry } from "@commandselector/shared";
import { useLibraryStore } from "../store/library";
import {
  NButton,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NSpace,
  NDynamicTags,
  NSelect,
  NCheckbox,
  NDivider,
  useMessage
} from "naive-ui";

const route = useRoute();
const router = useRouter();
const message = useMessage();
const { commands, saveCommand, loadLibrary } = useLibraryStore();

const id = computed(() => String(route.params.id ?? ""));
const isNew = computed(() => id.value === "new");

const draft = reactive<CommandEntry>({
  id: "",
  name: "",
  description: "",
  category: "",
  tags: [],
  engine: "cmd",
  template: "",
  powershellTemplate: "",
  params: [],
  platform: "windows",
  usage: ""
});

onMounted(async () => {
  await loadLibrary();
  if (!isNew.value) {
    const existing = commands.value.find(c => c.id === id.value);
    if (existing) {
      Object.assign(draft, JSON.parse(JSON.stringify(existing)));
      // 默认编辑 CMD 模板
      templateEditMode.value = "cmd";
    } else {
      message.error("找不到该命令");
      router.replace({ name: "commands" });
    }
  }
});

const platformOptions = [
  { label: "Windows", value: "windows" },
  { label: "macOS", value: "macos" },
  { label: "Linux", value: "linux" },
  { label: "不限", value: "any" }
];

const paramTypeOptions = [
  { label: "文本 (Text)", value: "text" },
  { label: "数字 (Number)", value: "number" },
  { label: "路径 (Path)", value: "path" },
  { label: "枚举 (Enum)", value: "enum" },
  { label: "布尔 (Boolean)", value: "boolean" }
];

function addParam() {
  draft.params.push({
    key: `param_${draft.params.length + 1}`,
    label: "新参数",
    type: "text",
    required: false,
    defaultValue: "",
    hint: ""
  });
}

function removeParam(index: number) {
  draft.params.splice(index, 1);
}

async function handleSave() {
  if (!draft.id) {
    message.error("命令 ID 不能为空");
    return;
  }
    if (!draft.name) {
    message.error("命令名称不能为空");
    return;
  }
  // 根据模板类型验证相应模板
  if (templateEditMode.value === "powershell") {
    if (!draft.powershellTemplate) {
      message.error("PowerShell 模板不能为空");
      return;
    }
  } else {
    if (!draft.template) {
      message.error("CMD 模板不能为空");
      return;
    }
  }
  await saveCommand(JSON.parse(JSON.stringify(draft)));
  message.success("保存成功");
  router.push({ name: "commands", query: { id: draft.id } });
}

function handleCancel() {
  router.back();
}

const templateEditMode = ref<"cmd" | "powershell" | "cmd+powershell">("cmd");

// 当选择混合模式时，内部使用这个状态来决定编辑哪个模板
const templateSubMode = ref<"cmd" | "powershell">("cmd");

// 当前编辑的模板内容（计算属性，用于双向绑定）
const currentTemplateValue = computed({
  get() {
    if (templateEditMode.value === 'cmd+powershell' && templateSubMode.value === 'powershell') {
      return draft.powershellTemplate ?? '';
    }
    if (templateEditMode.value === 'powershell') {
      return draft.powershellTemplate ?? '';
    }
    return draft.template;
  },
  set(value: string) {
    if (templateEditMode.value === 'cmd+powershell' && templateSubMode.value === 'powershell') {
      draft.powershellTemplate = value;
    } else if (templateEditMode.value === 'powershell') {
      draft.powershellTemplate = value;
    } else {
      draft.template = value;
    }
  }
});

function handleEngineChange() {
  // 不需要做额外处理，templateEditMode 切换即可
}
</script>

<template>
  <div style="max-width: 800px; margin: 0 auto; padding: 24px; overflow-y: auto;">
    <n-space vertical size="large">
      <n-card :title="isNew ? '新建命令' : `编辑命令：${id}`" size="small">
        <template #header-extra>
          <n-space>
            <n-button @click="handleCancel">取消</n-button>
            <n-button type="primary" @click="handleSave">保存</n-button>
          </n-space>
        </template>
        
        <n-form label-placement="top" require-mark-placement="right-hanging">
          <n-space vertical size="large">
            <!-- 基本信息 -->
            <div>
              <n-divider title-placement="left">基本信息</n-divider>
              <n-space vertical>
                <n-form-item label="唯一 ID (英文/连字符)" required>
                  <n-input v-model:value="draft.id" placeholder="如：clean-temp" :disabled="!isNew" />
                </n-form-item>
                <n-form-item label="命令名称" required>
                  <n-input v-model:value="draft.name" placeholder="如：清理临时文件" />
                </n-form-item>
                <n-form-item label="描述">
                  <n-input v-model:value="draft.description" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" />
                </n-form-item>
                <n-space item-style="flex: 1;">
                  <n-form-item label="分类">
                    <n-input v-model:value="draft.category" placeholder="如：系统维护" />
                  </n-form-item>
                  <n-form-item label="模板类型">
                    <n-select v-model:value="templateEditMode" :options="[
                      { label: '仅 CMD 模板', value: 'cmd' },
                      { label: '仅 PowerShell 模板', value: 'powershell' }
                    ]" @update:value="handleEngineChange" />
                  </n-form-item>
                  <n-form-item label="适用平台">
                    <n-select v-model:value="draft.platform" :options="platformOptions" />
                  </n-form-item>
                </n-space>
                <n-form-item label="标签">
                  <n-dynamic-tags v-model:value="draft.tags" />
                </n-form-item>
              </n-space>
            </div>

            <!-- 命令模板 -->
            <div>
              <n-divider title-placement="left">命令模板</n-divider>

              <n-form-item :label="templateEditMode === 'powershell' ? 'PowerShell 模板内容' : 'CMD 模板内容'" required>
                <n-input
                  v-model:value="currentTemplateValue"
                  type="textarea"
                  :autosize="{ minRows: 4, maxRows: 10 }"
                  :placeholder="templateEditMode === 'powershell' ? '使用 {{参数名}} 作为占位符，如：Test-Path {{path}}' : '使用 {{参数名}} 作为占位符，如：ping {{target}} -n {{count}}'"
                  style="font-family: monospace;"
                />
              </n-form-item>
              <n-form-item label="使用说明">
                <n-input v-model:value="draft.usage" type="textarea" :autosize="{ minRows: 2, maxRows: 6 }" placeholder="补充说明或注意事项" />
              </n-form-item>
            </div>

            <!-- 参数配置 -->
            <div>
              <n-divider title-placement="left">参数定义</n-divider>
              <n-space vertical>
                <n-card v-for="(param, index) in draft.params" :key="index" size="small" style="background: #fcfcfd;">
                  <template #header>参数 {{ index + 1 }}</template>
                  <template #header-extra>
                    <n-button size="tiny" type="error" ghost @click="removeParam(index)">删除</n-button>
                  </template>
                  
                  <n-space vertical>
                    <n-space item-style="flex: 1;">
                      <n-form-item label="参数键 (Key)" required>
                        <n-input v-model:value="param.key" placeholder="如：target" />
                      </n-form-item>
                      <n-form-item label="显示名称" required>
                        <n-input v-model:value="param.label" placeholder="如：目标地址" />
                      </n-form-item>
                      <n-form-item label="类型">
                        <n-select v-model:value="param.type" :options="paramTypeOptions" />
                      </n-form-item>
                    </n-space>
                    
                    <n-space item-style="flex: 1;">
                      <n-form-item label="默认值">
                        <n-input v-if="param.type !== 'boolean'" :value="String(param.defaultValue ?? '')" @update:value="param.defaultValue = $event" placeholder="选填" />
                        <n-checkbox v-else :checked="Boolean(param.defaultValue)" @update:checked="param.defaultValue = $event">默认启用</n-checkbox>
                      </n-form-item>
                      <n-form-item label="提示说明">
                        <n-input v-model:value="param.hint" placeholder="输入框占位提示" />
                      </n-form-item>
                      <n-form-item label="是否必填">
                        <n-checkbox v-model:checked="param.required">必填</n-checkbox>
                      </n-form-item>
                    </n-space>
                  </n-space>
                </n-card>
                
                <n-button dashed block @click="addParam">
                  添加新参数
                </n-button>
              </n-space>
            </div>
          </n-space>
        </n-form>
      </n-card>
    </n-space>
  </div>
</template>
