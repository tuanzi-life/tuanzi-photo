<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { usePhotoStore } from "../stores/photo";

const photoStore = usePhotoStore();
const { currentPhoto } = storeToRefs(photoStore);

const isOpen = computed({
  get: () => currentPhoto.value !== null,
  set: (v) => {
    if (!v) photoStore.setCurrentPhoto(null);
  },
});

function handleDelete() {
  if (currentPhoto.value) {
    photoStore.deletePhoto(currentPhoto.value.id);
  }
}

function handlePush() {
  if (currentPhoto.value) {
    photoStore.pushToScreen(currentPhoto.value.id);
  }
}
</script>

<template>
  <UModal v-model:open="isOpen" :ui="{ content: 'max-w-3xl' }">
    <template #content>
      <div v-if="currentPhoto" class="flex flex-col sm:flex-row overflow-hidden max-h-[85vh]">
        <!-- 左侧大图 -->
        <div class="flex-1 bg-muted min-h-48 sm:min-h-0">
          <img :src="currentPhoto.url" :alt="currentPhoto.filename" class="w-full h-full object-contain" />
        </div>

        <!-- 右侧信息 -->
        <div class="w-full sm:w-64 p-5 flex flex-col gap-4 shrink-0">
          <div class="flex items-start justify-between gap-2">
            <p class="font-medium text-highlighted text-sm break-all">{{ currentPhoto.filename }}</p>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="xs" @click="isOpen = false" />
          </div>

          <div>
            <p class="text-xs text-muted mb-2">标签</p>
            <div class="flex flex-wrap gap-1.5">
              <UBadge
                v-for="tag in currentPhoto.tags"
                :key="tag"
                :label="tag"
                color="neutral"
                variant="subtle"
                size="sm"
              />
            </div>
          </div>

          <div class="flex flex-col gap-2 mt-auto">
            <UButton color="primary" size="sm" icon="i-lucide-monitor" @click="handlePush"> 推送到墨水屏 </UButton>
            <UButton color="error" variant="outline" size="sm" icon="i-lucide-trash-2" @click="handleDelete">
              删除图片
            </UButton>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
