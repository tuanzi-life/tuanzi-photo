<script setup lang="ts">
import { usePhotoStore } from "../stores/photo";

const photoStore = usePhotoStore();
</script>

<template>
  <header class="flex items-center justify-between px-4 h-12 border-b border-default bg-default">
    <div class="flex items-center gap-2">
      <span class="w-2 h-2 rounded-full bg-primary inline-block" />
      <span class="font-semibold text-sm text-highlighted">团子相册</span>
    </div>
    <UButton color="primary" size="xs" @click="photoStore.uploadPhoto()"> 上传 </UButton>
  </header>
</template>
