<script setup lang="ts">
import { computed } from "vue";
import type { ScriptFileMeta } from "@commandselector/shared";

const props = defineProps<{
  script: ScriptFileMeta;
}>();

const emit = defineEmits<{
  (e: "edit", id: string): void;
}>();

// 计算脚本摘要描述（优先使用简短描述）
const summaryDescription = computed(() => {
  // 优先使用元数据中的简短描述
  if (props.script.metadata?.shortDescription) {
    return props.script.metadata.shortDescription;
  }
  // 其次使用元数据中的完整描述
  if (props.script.metadata?.description) {
    return props.script.metadata.description;
  }
  // 最后使用 script.description
  if (props.script.description) {
    return props.script.description;
  }
  return "暂无描述信息";
});

// 判断描述是否有有效值
const hasValidDescription = computed(() => {
  const desc = props.script.metadata?.shortDescription
    || props.script.metadata?.description
    || props.script.description
    || "";
  return desc.trim().length > 0;
});

// 格式化文件大小
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// 获取同步状态图标
function getSyncStatusIcon(status?: string): string {
  if (!status) return "";
  if (status === "synced") return "";
  if (status === "modified") return "●";
  if (status === "file-missing") return "⚠️";
  return "";
}

// 获取文件类型标签
function getTypeLabel(type: string): string {
  return type === "ps1" ? "PowerShell" : "Batch";
}

function handleEdit() {
  emit("edit", props.script.id);
}
</script>

<template>
  <div class="cs-script-card" @dblclick="handleEdit">
    <!-- 功能图标区域 -->
    <div class="cs-card-icon">
      <!-- 批处理图标 -->
      <svg
        v-if="script.type === 'bat'"
        t="1776585973976"
        class="icon"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="10680"
        width="32"
        height="32"
      >
        <path
          d="M324.608 312.32l-60.416 60.416 140.288 140.288-139.264 139.264 60.416 60.416 199.68-199.68-200.704-200.704z m193.536 345.088h235.52v97.28h-235.52v-97.28zM28.672 76.8v870.4h967.68v-870.4H28.672z m870.4 774.144H124.928V173.056h774.144v677.888z"
          fill="#2c2c2c"
          p-id="10681"
        ></path>
      </svg>
      <!-- PowerShell 图标 -->
      <svg
        v-else
        t="1776586132329"
        class="icon"
        viewBox="0 0 1288 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="2609"
        width="32"
        height="32"
      >
        <path
          d="M1221.738005 241.016455h-1004.590711A102.165382 102.165382 0 0 0 118.607823 319.933347L1.298929 945.722974A65.266403 65.266403 0 0 0 69.764666 1023.786711h1013.975421a97.899604 97.899604 0 0 0 93.207249-78.063737L1286.364541 319.933347a63.986669 63.986669 0 0 0-64.626536-78.916892z"
          p-id="2610"
        ></path>
        <path
          d="M224.825695 248.694855a100.459071 100.459071 0 0 0-95.980005 76.784004L13.882974 939.750885a63.986669 63.986669 0 0 0 67.186003 76.570715h306.709436l149.302229-767.840034z"
          fill="#103F91"
          p-id="2611"
        ></path>
        <path
          d="M1210.433693 248.694855H921.000658l-140.770673 767.840034H1074.995243a95.766715 95.766715 0 0 0 90.434492-76.570715l108.350761-614.272027a63.986669 63.986669 0 0 0-63.346803-76.997292z"
          fill="#2B7CD3"
          p-id="2612"
        ></path>
        <path
          d="M511.699263 248.694855l-146.102896 767.840034h430.843575l145.889606-767.840034H511.699263z"
          fill="#185ABD"
          p-id="2613"
        ></path>
        <path
          d="M221.413072 910.103728a31.993335 31.993335 0 0 1-19.196001-57.588002l313.534681-235.684233L274.09543 405.248906a32.185295 32.185295 0 1 1 42.65778-48.203291l258.079567 225.233077a45.643824 45.643824 0 0 1 16.209956 36.68569 46.49698 46.49698 0 0 1-18.982712 35.619246L240.609073 903.705061a31.993335 31.993335 0 0 1-19.196001 6.398667zM581.018155 871.285149h416.979795M997.784662 903.278484H580.804866a31.993335 31.993335 0 0 1 0-63.98667h416.979796a31.993335 31.993335 0 0 1 0 63.98667z"
          fill="#FFFFFF"
          p-id="2614"
        ></path>
        <path
          d="M1198.276226 255.946678v268.530723A29.647157 29.647157 0 0 1 1169.268936 554.551135H651.403491a29.647157 29.647157 0 0 1-29.00729-30.073734V255.946678z"
          p-id="2615"
        ></path>
        <path
          d="M1176.947336 255.946678v249.548011a27.300979 27.300979 0 0 1-26.661112 27.727556h-479.900021a27.300979 27.300979 0 0 1-26.661112-27.727556V255.946678z"
          p-id="2616"
        ></path>
        <path
          d="M665.05398 0m25.594668 0l460.70402 0q25.594668 0 25.594668 25.594668l0 460.70402q0 25.594668-25.594668 25.594668l-460.70402 0q-25.594668 0-25.594668-25.594668l0-460.70402q0-25.594668 25.594668-25.594668Z"
          fill="#185ABD"
          p-id="2617"
        ></path>
        <path
          d="M729.04065 85.315559h106.644449a121.148094 121.148094 0 0 1 48.203291 8.531556 89.581337 89.581337 0 0 1 33.059779 23.461779 93.847115 93.847115 0 0 1 18.982712 34.126224 139.064362 139.064362 0 0 1 6.185378 42.657779 144.396584 144.396584 0 0 1-5.545511 40.524891 93.420537 93.420537 0 0 1-18.556134 33.486357 91.714226 91.714226 0 0 1-32.206624 22.821912 120.934805 120.934805 0 0 1-47.136846 8.318267h-51.829203v145.036451h-57.801291z m57.801291 56.948136v101.738804h47.563425a65.266403 65.266403 0 0 0 22.608623-3.625911 40.73818 40.73818 0 0 0 24.314934-26.021245 72.731514 72.731514 0 0 0 0-40.524891 44.790669 44.790669 0 0 0-8.958134-16.636534 40.311602 40.311602 0 0 0-15.3568-10.877734 56.948136 56.948136 0 0 0-21.32889-4.052489zM1115.093556 258.719433a4.265778 4.265778 0 0 1-3.199334-1.279733 11.304312 11.304312 0 0 1-1.706311-3.199333v-3.839201a10.237867 10.237867 0 0 0-1.279734-3.8392 71.66507 71.66507 0 0 0-11.091022-11.944178 77.850448 77.850448 0 0 0-14.716934-10.024578 91.287648 91.287648 0 0 0-17.063112-6.611956 63.986669 63.986669 0 0 0-17.916268-2.559467 78.063737 78.063737 0 0 0-14.503645 1.279734 42.65778 42.65778 0 0 0-12.370756 4.052489 24.954801 24.954801 0 0 0-8.318267 7.251822 18.129556 18.129556 0 0 0-3.199333 10.877734 22.821912 22.821912 0 0 0 3.412622 12.370756 32.206624 32.206624 0 0 0 10.024578 8.958134 83.609248 83.609248 0 0 0 16.849823 7.6784c6.825245 2.559467 14.716934 5.118934 23.8883577.891689a144.823162 144.823162 0 0 1 62.280358 34.552802 68.465736 68.465736 0 0 1 19.835868 48.41658 85.315559 85.315559 0 0 1-7.038534 34.552801 90.434493 90.434493 0 0 1-21.32889 28.794001 97.899604 97.899604 0 0 1-31.780046 19.835868 118.588627 118.588627 0 0 1-42.657779 7.251822 138.851073 138.851073 0 0 1-55.241825-10.877733 140.344095 140.344095 0 0 1-45.643824-34.766091l29.433868-60.360758a6.398667 6.398667 0 0 1 4.479067 4.052489c0 2.346178 2.132889 5.545511 3.625911 9.811289a49.269735 49.269735 0 0 0 11.517601 14.077068 107.924182 107.924182 0 0 0 14.930222 12.797334 97.899604 97.899604 0 0 0 19.196001 8.958133 56.948136 56.948136 0 0 0 19.196001 3.412623 61.213914 61.213914 0 0 0 31.353468-6.611956 21.32889 21.32889 0 0 0 11.091023-19.835868 28.794001 28.794001 0 0 0-2.346178-11.730889 26.874401 26.874401 0 0 0-7.891689-9.384712 55.241825 55.241825 0 0 0-13.863779-8.318267c-5.7588-2.559467-13.010623-5.118934-21.328889-7.891689l-14.077068-4.692356c-4.692356-1.493022-9.171423-3.412622-13.863778-5.332222a158.68694 158.68694 0 0 1-24.741512-13.437201 85.315559 85.315559 0 0 1-18.342846-16.636534 63.986669 63.986669 0 0 1-11.5176-21.328889 83.18267 83.18267 0 0 1-4.052489-26.021246 62.706936 62.706936 0 0 1 8.531556-28.367423 82.329515 82.329515 0 0 1 19.40929-25.594668 93.633826 93.633826 0 0 1 29.433868-18.556134 95.340137 95.340137 0 0 1 36.472401-7.251823 114.109561 114.109561 0 0 1 50.122891 11.091023 118.801916 118.801916 0 0 1 42.657779 35.619246z"
          fill="#FFFFFF"
          p-id="2618"
        ></path>
      </svg>
    </div>

    <!-- 主要内容 -->
    <div class="cs-card-content">
      <div class="cs-card-title">
        {{ script.name }}
        <span v-if="getSyncStatusIcon(script.syncStatus)" class="cs-sync-indicator">
          {{ getSyncStatusIcon(script.syncStatus) }}
        </span>
      </div>

      <!-- 原按钮位置显示描述摘要 -->
      <div class="cs-card-description" :class="{ 'has-value': hasValidDescription }">
        {{ summaryDescription }}
      </div>
    </div>

    <!-- 元信息 -->
    <div class="cs-card-meta">
      <span class="cs-meta-type">{{ getTypeLabel(script.type) }}</span>
      <span class="cs-meta-size">{{ formatSize(script.size) }}</span>
    </div>

    <!-- 编辑按钮 - 移到右上角 -->
    <button
      class="cs-action-btn cs-action-edit"
      type="button"
      title="编辑"
      @click.stop="handleEdit"
    >
      ✏️
    </button>
  </div>
</template>

<style scoped>
.cs-script-card {
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: #faf9f5;
  border: 1px solid #f0eee6;
  border-radius: 12px;
  box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.05);
  transition: all 0.25s ease;
  min-height: 180px;
  position: relative;
}

.cs-script-card:hover {
  transform: translateY(-4px);
  box-shadow:
    #faf9f5 0px 0px 0px 0px,
    #d1cfc5 0px 0px 0px 1px;
}

.cs-card-icon {
  align-self: center;
  font-size: 32px;
  line-height: 1;
  margin-bottom: 12px;
  color: #c96442;
}

.cs-card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.cs-card-title {
  font-family: "Georgia", serif;
  font-size: 18px;
  font-weight: 500;
  color: #141413;
  line-height: 1.30;
  display: flex;
  align-items: center;
  gap: 8px;
}

.cs-sync-indicator {
  font-size: 12px;
  margin-left: auto;
  color: #c96442;
}

.cs-card-description {
  font-family: system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
  font-size: 14px;
  color: #5e5d59;
  line-height: 1.60;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 44px;
}

.cs-card-description.has-value {
  color: #141413;
}

.cs-card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0eee6;
}

.cs-meta-type {
  font-family: system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
  font-size: 11px;
  font-weight: 500;
  color: #5e5d59;
  background: #e8e6dc;
  padding: 4px 10px;
  border-radius: 6px;
  letter-spacing: 0.12px;
}

.cs-meta-size {
  font-family: system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
  font-size: 13px;
  color: #87867f;
}

/* 编辑按钮 - 移到右上角 */
.cs-action-btn {
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e8e6dc;
  transition: all 0.25s ease;
  box-shadow:
    #e8e6dc 0px 0px 0px 0px,
    #d1cfc5 0px 0px 0px 1px;
  position: absolute;
  top: 12px;
  right: 12px;
}

.cs-action-btn:hover {
  transform: scale(1.1);
}

.cs-action-edit:hover {
  box-shadow:
    #dbeafe 0px 0px 0px 0px,
    #dbeafe 0px 0px 0px 1px;
}
</style>
