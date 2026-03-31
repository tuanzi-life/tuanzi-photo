<script setup lang="ts">
defineProps<{
  modelValue: "photos" | "schedule";
}>();

const emit = defineEmits<{
  "update:modelValue": [value: "photos" | "schedule"];
}>();

const tabs = [
  { value: "photos" as const, label: "照片", icon: "i-lucide-image" },
  { value: "schedule" as const, label: "定时", icon: "i-lucide-clock" },
];
</script>

<template>
  <nav class="flex border-t border-default bg-default pb-[env(safe-area-inset-bottom)]">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      class="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs transition-colors"
      :class="modelValue === tab.value ? 'bg-primary text-white' : 'text-muted'"
      @click="emit('update:modelValue', tab.value)"
    >
      <UIcon :name="tab.icon" class="size-5" />
      <span>{{ tab.label }}</span>
    </button>
  </nav>
</template>
