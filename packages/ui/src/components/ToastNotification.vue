<script setup lang="ts">
defineProps<{
  toast: { text: string; kind: "success" | "error" } | null;
}>();
</script>

<template>
  <div v-if="toast" class="cs-toast" :class="toast.kind" role="status">
    <svg
      v-if="toast.kind === 'success'"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="cs-toast-icon"
    >
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
    {{ toast.text }}
  </div>
</template>

<style scoped>
@import "../styles/components.css";
</style>
