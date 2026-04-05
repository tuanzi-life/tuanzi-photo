<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { usePhotoStore } from "../stores/photo";
import { useBatteryStore } from "../stores/battery";
import MobileHeader from "../components/MobileHeader.vue";
import MobileTabBar from "../components/MobileTabBar.vue";
import InlineTagFilter from "../components/InlineTagFilter.vue";
import PhotoGrid from "../components/PhotoGrid.vue";
import EmptyState from "../components/EmptyState.vue";
import PhotoDetailOverlay from "../components/PhotoDetailOverlay.vue";
import SchedulePanel from "../components/SchedulePanel.vue";

const photoStore = usePhotoStore();
const batteryStore = useBatteryStore();
const { filteredPhotos, photos } = storeToRefs(photoStore);

const activeTab = ref<"photos" | "schedule">("photos");
let stopBatteryPolling: (() => void) | null = null;

onMounted(() => {
  stopBatteryPolling = batteryStore.startPolling();
});

onUnmounted(() => {
  stopBatteryPolling?.();
  stopBatteryPolling = null;
});
</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden">
    <!-- 顶部 Header，仅照片 tab 显示 -->
    <MobileHeader v-if="activeTab === 'photos'" />

    <!-- 主内容区 -->
    <main class="flex-1 overflow-hidden">
      <!-- 照片视图 -->
      <div v-if="activeTab === 'photos'" class="flex flex-col h-full">
        <InlineTagFilter />
        <div class="flex items-center px-3 py-1">
          <span class="text-xs text-muted"
            >{{ filteredPhotos.length }}/{{ photos.length }} 张</span
          >
        </div>
        <div class="flex-1 overflow-y-auto px-3 pb-3">
          <PhotoGrid
            v-if="filteredPhotos.length > 0"
            :photos="filteredPhotos"
            :columns="2"
          />
          <EmptyState
            v-else
            icon="i-lucide-image"
            title="还没有照片"
            description="点击上传图片"
          />
        </div>
      </div>

      <!-- 定时视图 -->
      <div v-else class="flex flex-col h-full">
        <div class="flex items-center px-4 h-12 border-b border-default bg-default">
          <span class="font-semibold text-sm text-highlighted">定时设置</span>
        </div>
        <div class="flex-1 overflow-y-auto p-4">
          <SchedulePanel />
        </div>
      </div>
    </main>

    <!-- 底部 Tab Bar -->
    <MobileTabBar v-model="activeTab" />

    <!-- 全局弹层 -->
    <PhotoDetailOverlay />
  </div>
</template>
