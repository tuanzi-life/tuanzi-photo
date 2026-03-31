<script setup lang="ts">
import { storeToRefs } from "pinia";
import { usePhotoStore } from "../stores/photo";

const photoStore = usePhotoStore();
const { allTags, selectedTags } = storeToRefs(photoStore);
</script>

<template>
  <div
    v-if="allTags.length > 0"
    class="flex gap-2 overflow-x-auto px-3 py-2 scrollbar-none"
  >
    <UButton
      v-for="{ tag, count } in allTags"
      :key="tag"
      size="xs"
      :color="selectedTags.includes(tag) ? 'primary' : 'neutral'"
      :variant="selectedTags.includes(tag) ? 'solid' : 'outline'"
      class="shrink-0"
      @click="photoStore.toggleTag(tag)"
    >
      {{ tag }}
      <span class="ml-1 opacity-70">{{ count }}</span>
    </UButton>
  </div>
</template>
