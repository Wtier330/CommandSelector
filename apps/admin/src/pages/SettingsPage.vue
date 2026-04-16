<script setup lang="ts">
import { computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { NCard, NSpace, NText, NTag, NPageHeader } from "naive-ui";
import { useLibraryStore } from "../store/library";

const router = useRouter();
type TagType = "default" | "success" | "info" | "warning" | "error";

const { librarySource, lastUpdateTime, commands } = useLibraryStore();

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
</style>
