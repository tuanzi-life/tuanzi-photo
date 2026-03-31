<script setup lang="ts">
import { onMounted } from "vue";
import { useBreakpoints, breakpointsTailwind } from "@vueuse/core";
import { usePhotoStore } from "../stores/photo";
import { useScheduleStore } from "../stores/schedule";
import DesktopLayout from "../layouts/DesktopLayout.vue";
import MobileLayout from "../layouts/MobileLayout.vue";

const photoStore = usePhotoStore();
const scheduleStore = useScheduleStore();

const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = breakpoints.smaller("md");

onMounted(() => {
  photoStore.fetchPhotos();
  scheduleStore.fetchSchedule();
});
</script>

<template>
  <MobileLayout v-if="isMobile" />
  <DesktopLayout v-else />
</template>
