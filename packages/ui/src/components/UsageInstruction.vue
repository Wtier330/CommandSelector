<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{
  usage?: string;
  collapsible?: boolean;
}>();

const usageOpen = ref(true);
const usageTouched = ref(false);

watch(
  () => props.usage,
  () => {
    usageTouched.value = false;
    usageOpen.value = true;
  },
  { immediate: true, flush: "sync" }
);

watch(
  () => props.collapsible,
  (_newVal) => {
    // 移除自动折叠逻辑，保持默认展开，除非用户手动点击
  },
  { immediate: true, flush: "sync" }
);

function toggleUsage() {
  usageTouched.value = true;
  usageOpen.value = !usageOpen.value;
}
</script>

<template>
  <div v-if="usage" class="cs-usage-section">
    <div class="cs-usage-icon-wrap">
      <span class="cs-usage-icon">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      </span>
    </div>
    <div class="cs-usage-content">
      <div class="cs-usage-head" :class="{ 'is-collapsible': collapsible }" @click="collapsible ? toggleUsage() : null">
        <span class="cs-section-title">使用说明</span>
        <span v-if="collapsible" class="cs-chev" aria-hidden="true">
          <svg v-if="usageOpen" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </span>
      </div>
      <div v-show="usageOpen || !collapsible" class="cs-usage-body">
        {{ usage }}
      </div>
    </div>
  </div>
</template>

<style scoped>
@import "../styles/command-detail.css";
</style>
