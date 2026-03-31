<script setup lang="ts">
import { usePhotoStore } from "../stores/photo";
import { storeToRefs } from "pinia";

const photoStore = usePhotoStore();
const { allTags, selectedTags } = storeToRefs(photoStore);
</script>

<template>
  <div class="flex flex-col gap-1">
    <p class="text-xs font-medium text-muted uppercase tracking-wide mb-1">标签筛选</p>
    <div
      v-if="allTags.length === 0"
      class="flex flex-col items-center justify-center gap-2 py-8 text-center"
    >
      <UIcon name="i-lucide-tag" class="w-5 h-5 text-muted" />
      <p class="text-sm font-medium text-highlighted">暂无标签</p>
      <p class="text-xs text-muted">上传照片后标签会自动出现</p>
    </div>
    <button
      v-for="item in allTags"
      :key="item.tag"
      class="flex items-center justify-between px-3 py-1.5 rounded-md text-sm cursor-pointer transition-colors"
      :class="
        selectedTags.includes(item.tag)
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-default hover:bg-elevated'
      "
      @click="photoStore.toggleTag(item.tag)"
    >
      <span>{{ item.tag }}</span>
      <UBadge :label="String(item.count)" color="neutral" variant="subtle" size="sm" />
    </button>
  </div>
</template>
