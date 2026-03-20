<script setup lang="ts">
import { reactive } from "vue";
import { NCard, NForm, NFormItem, NInput, NSpace, NText } from "naive-ui";

const settings = reactive({
  dbPath: "",
  publishDir: "",
});
</script>

<template>
  <n-space vertical size="large">
    <n-card title="设置" size="small">
      <n-text depth="3">此页面为初始化骨架，后续将接入文件选择器与本地配置。</n-text>
    </n-card>

    <n-card title="存储与发布" size="small">
      <n-form label-placement="top">
        <n-form-item label="SQLite 路径">
          <n-input v-model:value="settings.dbPath" placeholder="留空则使用默认应用目录（后续）" />
        </n-form-item>
        <n-form-item label="发布目录">
          <n-input v-model:value="settings.publishDir" placeholder="例如：D:\\iisroot\\command-library" />
        </n-form-item>
      </n-form>
    </n-card>
  </n-space>
</template>
