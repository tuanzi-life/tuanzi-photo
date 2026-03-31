<script setup lang="ts">
import { ref } from "vue";
import { storeToRefs } from "pinia";
import { usePhotoStore } from "../stores/photo";

const photoStore = usePhotoStore();
const { allTags, selectedTags } = storeToRefs(photoStore);

const isOpen = defineModel<boolean>("open", { default: false });
const localSelected = ref<string[]>([]);

function onOpen() {
  localSelected.value = [...selectedTags.value];
}

function toggleTag(tag: string) {
  const idx = localSelected.value.indexOf(tag);
  if (idx === -1) {
    localSelected.value.push(tag);
  } else {
    localSelected.value.splice(idx, 1);
  }
}

function confirm() {
  photoStore.selectedTags = localSelected.value;
  isOpen.value = false;
}
</script>

<template>
  <USlideover v-model:open="isOpen" side="bottom" title="标签筛选" @update:open="(v: boolean) => v && onOpen()">
    <div class="p-4 flex flex-col gap-4">
      <div class="flex flex-wrap gap-2">
        <UBadge
          v-for="item in allTags"
          :key="item.tag"
          :label="`${item.tag} (${item.count})`"
          :color="localSelected.includes(item.tag) ? 'primary' : 'neutral'"
          :variant="localSelected.includes(item.tag) ? 'solid' : 'outline'"
          class="cursor-pointer"
          @click="toggleTag(item.tag)"
        />
        <span v-if="allTags.length === 0" class="text-sm text-muted">暂无标签</span>
      </div>
      <UButton color="primary" block @click="confirm">确认</UButton>
    </div>
  </USlideover>
</template>
