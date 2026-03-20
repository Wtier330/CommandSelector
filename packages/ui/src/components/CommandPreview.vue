<script setup lang="ts">
defineProps<{
  finalCommand: string;
  canCopy: boolean;
  validationOk: boolean;
  validationReasons: string[];
}>();

defineEmits<{
  (e: "copy"): void;
}>();
</script>

<template>
  <div class="cs-preview-wrap" style="flex: 1; display: flex; flex-direction: column; min-height: 0;">
    <div class="cs-preview-header">
      <h2 class="cs-section-title-text">最终命令预览</h2>
      <button class="cs-btn cs-copy-btn-outline" type="button" :disabled="!canCopy" @click.stop="$emit('copy')">
        复制
      </button>
    </div>
    <div class="cs-code-wrap">
      <div class="cs-code-container">
        <pre
          class="cs-code cs-code-clickable"
          role="button"
          tabindex="0"
          @click="$emit('copy')"
          @keydown.enter.prevent="$emit('copy')"
          @keydown.space.prevent="$emit('copy')"
        ><code>{{ finalCommand }}</code></pre>
      </div>
      <div v-if="!validationOk" class="cs-alert">
        {{ validationReasons.join("；") }}
      </div>
    </div>
  </div>
</template>

<style scoped>
@import "../styles/command-detail.css";
</style>
