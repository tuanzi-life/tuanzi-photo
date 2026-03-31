<script setup lang="ts">
import { storeToRefs } from "pinia";
import { usePhotoStore } from "../stores/photo";
import AppHeader from "../components/AppHeader.vue";
import TagFilter from "../components/TagFilter.vue";
import SchedulePanel from "../components/SchedulePanel.vue";
import PhotoGrid from "../components/PhotoGrid.vue";
import EmptyState from "../components/EmptyState.vue";
import PhotoDetailOverlay from "../components/PhotoDetailOverlay.vue";

const photoStore = usePhotoStore();
const { filteredPhotos, photos, selectedTags } = storeToRefs(photoStore);
</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden">
    <AppHeader />

    <div class="flex flex-1 overflow-hidden">
      <!-- 左侧控制栏 -->
      <aside class="w-72 shrink-0 border-r border-default overflow-y-auto p-4 flex flex-col gap-6">
        <TagFilter />
        <USeparator />
        <SchedulePanel />
      </aside>

      <!-- 右侧画廊 -->
      <main class="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        <!-- 统计栏 -->
        <div class="text-sm text-muted">
          共 {{ photos.length }} 张照片
          <template v-if="selectedTags.length > 0">
            · 已选 {{ selectedTags.length }} 个标签 · {{ filteredPhotos.length }} 张结果
          </template>
        </div>

        <!-- 照片网格 / 空状态 -->
        <PhotoGrid v-if="filteredPhotos.length > 0" :photos="filteredPhotos" />
        <EmptyState
          v-else
          icon="i-lucide-image"
          title="还没有照片"
          description="点击右上角上传图片，开始你的团子相册之旅"
        />
      </main>
    </div>

    <PhotoDetailOverlay />
  </div>
</template>
