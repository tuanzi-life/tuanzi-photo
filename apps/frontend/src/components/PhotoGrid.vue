<script setup lang="ts">
import type { Photo } from "../types";
import PhotoCard from "./PhotoCard.vue";

withDefaults(
  defineProps<{
    photos: Photo[];
    columns?: number;
  }>(),
  { columns: 0 }
);
</script>

<template>
  <div
    class="grid gap-2"
    :class="
      columns > 0 ? `grid-cols-${columns}` : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
    "
  >
    <PhotoCard v-for="photo in photos" :key="photo.id" :photo="photo" />
  </div>
</template>
