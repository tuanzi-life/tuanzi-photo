<script setup lang="ts">
import { usePhotoStore } from "../stores/photo";
import { storeToRefs } from "pinia";

const photoStore = usePhotoStore();
const { allTags, selectedTags } = storeToRefs(photoStore);
</script>

<template>
  <div class="flex flex-col gap-1">
    <p class="text-xs font-medium text-muted uppercase tracking-wide mb-1">标签筛选</p>
    <EmptyState
      v-if="allTags.length === 0"
      icon="i-lucide-tag"
      title="暂无标签"
      description="上传照片后标签会自动出现"
    />
    <button
      v-for="item in allTags"
      :key="item.tag"
      class="flex items-center justify-between px-3 py-1.5 rounded-md text-sm cursor-pointer transition-colors"
      :class="
        selectedTags.includes(item.tag) ? 'bg-primary/10 text-primary font-medium' : 'text-default hover:bg-elevated'
      "
      @click="photoStore.toggleTag(item.tag)"
    >
      <span>{{ item.tag }}</span>
      <UBadge :label="String(item.count)" color="neutral" variant="subtle" size="sm" />
    </button>
  </div>
</template>
