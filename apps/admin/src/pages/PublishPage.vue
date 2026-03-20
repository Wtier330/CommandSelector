<script setup lang="ts">
import { computed } from "vue";
import { NButton, NCard, NList, NListItem, NSpace, NText } from "naive-ui";
import { validateCommandText, type CommandEntry } from "@commandselector/shared";

const mockCommands: CommandEntry[] = [
  {
    id: "netstat-ports",
    name: "查看端口占用（netstat）",
    description: "列出监听端口与进程 PID",
    tags: ["network", "netstat"],
    engine: "cmd",
    template: "netstat -ano | findstr LISTENING",
    params: [],
    platform: "windows",
  },
  {
    id: "broken-quotes",
    name: "示例：引号错误",
    description: "用于演示静态校验输出",
    tags: ["example"],
    engine: "cmd+powershell",
    template: "powershell -Command \"Write-Host \"oops\"\"",
    params: [],
    platform: "windows",
  },
];

const validationErrors = computed(() => {
  const out: string[] = [];
  for (const c of mockCommands) {
    const r = validateCommandText(c.template);
    if (!r.ok) out.push(`${c.id}：${r.reasons.join("；")}`);
  }
  return out;
});
</script>

<template>
  <n-space vertical size="large">
    <n-card title="发布" size="small">
      <n-space justify="space-between" align="center">
        <n-text depth="3">此页面为初始化骨架，后续将生成并写入 library.json。</n-text>
        <n-button type="primary" disabled>发布（待接入）</n-button>
      </n-space>
    </n-card>

    <n-card title="发布前校验（骨架）" size="small">
      <n-list bordered>
        <n-list-item v-if="validationErrors.length === 0">未发现问题</n-list-item>
        <n-list-item v-for="e in validationErrors" :key="e">{{ e }}</n-list-item>
      </n-list>
    </n-card>
  </n-space>
</template>
