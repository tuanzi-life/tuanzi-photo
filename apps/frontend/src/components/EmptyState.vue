<script setup lang="ts">
defineProps<{
  icon?: string;
  title: string;
  description?: string;
}>();
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 py-16 text-center">
    <UIcon v-if="icon" :name="icon" class="w-12 h-12 text-muted" />
    <p class="font-medium text-highlighted">{{ title }}</p>
    <p v-if="description" class="text-sm text-muted max-w-xs">{{ description }}</p>
  </div>
</template>
