<script setup lang="ts">
import { ref } from "vue";
import { usePhotoStore } from "../stores/photo";
import { useBatteryStore } from "../stores/battery";

const photoStore = usePhotoStore();
const batteryStore = useBatteryStore();
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
  // 清空 input，允许重复选择同一文件
  if (fileInput.value) fileInput.value.value = "";
}
</script>

<template>
  <header
    class="flex items-center justify-between px-4 h-14 border-b border-default bg-default"
  >
    <div class="flex items-center gap-2">
      <img src="/logo.png" alt="Logo" class="w-8 h-8 rounded-full" />
      <span class="font-semibold text-base text-highlighted">团子相册</span>
    </div>
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="onFileChange"
    />
    <div class="flex items-center gap-3">
      <div
        v-if="batteryStore.percent !== null"
        class="flex items-center gap-1.5 text-sm text-muted"
      >
        <UIcon :name="batteryStore.iconName" class="size-4" />
        <span>{{ batteryStore.percent }}%</span>
      </div>
      <UButton
        color="primary"
        icon="i-lucide-plus"
        size="sm"
        :loading="uploading"
        @click="triggerUpload"
      >
        上传照片
      </UButton>
    </div>
  </header>
</template>
