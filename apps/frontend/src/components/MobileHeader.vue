<script setup lang="ts">
import { ref } from "vue";
import { usePhotoStore } from "../stores/photo";

const photoStore = usePhotoStore();
const fileInput = ref<HTMLInputElement | null>(null);
const uploading = ref(false);

function triggerUpload() {
  fileInput.value?.click();
}

async function onFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  uploading.value = true;
  await photoStore.uploadPhoto(file, []);
  uploading.value = false;
  if (fileInput.value) fileInput.value.value = "";
}
</script>

<template>
  <header class="flex items-center justify-between px-4 h-12 border-b border-default bg-default">
    <div class="flex items-center gap-2">
      <span class="w-2 h-2 rounded-full bg-primary inline-block" />
      <span class="font-semibold text-sm text-highlighted">团子相册</span>
    </div>
    <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
    <UButton color="primary" size="xs" :loading="uploading" @click="triggerUpload"> 上传 </UButton>
  </header>
</template>
