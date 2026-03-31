<script setup lang="ts">
import { usePhotoStore } from "../stores/photo";

const photoStore = usePhotoStore();
</script>

<template>
  <header class="flex items-center justify-between px-4 h-14 border-b border-default bg-default">
    <div class="flex items-center gap-2">
      <span class="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
      <span class="font-semibold text-base text-highlighted">团子相册</span>
    </div>
    <UButton color="secondary" icon="i-lucide-plus" size="sm" @click="photoStore.uploadPhoto()"> 上传图片 </UButton>
  </header>
</template>
