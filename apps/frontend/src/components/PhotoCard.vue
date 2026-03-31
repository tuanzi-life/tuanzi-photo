<script setup lang="ts">
import type { Photo } from "../types";
import { usePhotoStore } from "../stores/photo";

const props = defineProps<{ photo: Photo }>();
const photoStore = usePhotoStore();
</script>

<template>
  <div
    class="relative overflow-hidden rounded-lg cursor-pointer bg-muted aspect-square"
    @click="photoStore.setCurrentPhoto(props.photo)"
  >
    <img
      :src="photo.url"
      :alt="photo.filename"
      class="w-full h-full object-cover"
      loading="lazy"
    />
  </div>
</template>
