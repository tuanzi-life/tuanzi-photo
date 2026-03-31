<script setup lang="ts">
import { ref } from "vue";
import { storeToRefs } from "pinia";
import { usePhotoStore } from "../stores/photo";
import MobileHeader from "../components/MobileHeader.vue";
import PhotoGrid from "../components/PhotoGrid.vue";
import EmptyState from "../components/EmptyState.vue";
import PhotoDetailOverlay from "../components/PhotoDetailOverlay.vue";
import TagSheet from "../components/TagSheet.vue";
import ScheduleSheet from "../components/ScheduleSheet.vue";

const photoStore = usePhotoStore();
const { filteredPhotos, photos, selectedTags } = storeToRefs(photoStore);

const tagSheetOpen = ref(false);
const scheduleSheetOpen = ref(false);
</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden">
    <MobileHeader />

    <!-- 工具栏 -->
    <div class="flex items-center gap-2 px-3 py-2 border-b border-default bg-default">
      <UButton
        size="xs"
        color="neutral"
        :variant="selectedTags.length > 0 ? 'solid' : 'outline'"
        icon="i-lucide-tag"
        @click="tagSheetOpen = true"
      >
        标签
        <UBadge
          v-if="selectedTags.length > 0"
          :label="String(selectedTags.length)"
          color="primary"
          size="xs"
          class="ml-1"
        />
      </UButton>
      <UButton size="xs" color="neutral" variant="outline" icon="i-lucide-clock" @click="scheduleSheetOpen = true">
        定时
      </UButton>
      <span class="ml-auto text-xs text-muted">{{ filteredPhotos.length }}/{{ photos.length }}</span>
    </div>

    <!-- 照片网格 -->
    <main class="flex-1 overflow-y-auto p-3">
      <PhotoGrid v-if="filteredPhotos.length > 0" :photos="filteredPhotos" :columns="2" />
      <EmptyState v-else icon="i-lucide-image" title="还没有照片" description="点击上传图片" />
    </main>

    <PhotoDetailOverlay />
    <TagSheet v-model:open="tagSheetOpen" />
    <ScheduleSheet v-model:open="scheduleSheetOpen" />
  </div>
</template>
