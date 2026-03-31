<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useScheduleStore } from "../stores/schedule";
import { usePhotoStore } from "../stores/photo";

const scheduleStore = useScheduleStore();
const photoStore = usePhotoStore();
const { mode, hour, intervalHours, selectedTags, rule, nextRefreshTime } = storeToRefs(scheduleStore);

const hourOptions = Array.from({ length: 24 }, (_, i) => ({
  label: `${String(i).padStart(2, "0")}:00`,
  value: i,
}));
const { allTags } = storeToRefs(photoStore);
</script>

<template>
  <div class="flex flex-col gap-4">
    <p class="text-xs font-medium text-muted uppercase tracking-wide">定时刷新</p>

    <!-- 模式切换 -->
    <div class="flex gap-2">
      <URadioGroup
        v-model="mode"
        orientation="horizontal"
        variant="card"
        size="xs"
        :ui="{ label: 'text-xs text-default font-medium' }"
        :items="[
          { label: '每天定时', value: 'timing' },
          { label: '固定间隔', value: 'interval' },
        ]"
      />
    </div>

    <!-- 时间配置 -->
    <div v-if="mode === 'timing'">
      <label class="text-sm text-muted mb-1 block">刷新时间</label>
      <USelect v-model="hour" :items="hourOptions" size="sm" />
    </div>
    <div v-else>
      <label class="text-sm text-muted mb-1 block">间隔小时数</label>
      <UInput v-model="intervalHours" type="number" size="sm" :min="1" :max="24" />
    </div>

    <!-- 标签范围 -->
    <div>
      <label class="text-sm text-muted mb-2 block">标签范围</label>
      <div class="flex flex-wrap gap-1.5">
        <UBadge
          v-for="item in allTags"
          :key="item.tag"
          :label="item.tag"
          :color="selectedTags.includes(item.tag) ? 'primary' : 'neutral'"
          :variant="selectedTags.includes(item.tag) ? 'solid' : 'outline'"
          class="cursor-pointer"
          @click="
            selectedTags.includes(item.tag)
              ? selectedTags.splice(selectedTags.indexOf(item.tag), 1)
              : selectedTags.push(item.tag)
          "
        />
        <span v-if="allTags.length === 0" class="text-xs text-muted">暂无标签</span>
      </div>
    </div>

    <!-- 刷新规则 -->
    <div>
      <label class="text-sm text-muted mb-2 block">刷新规则</label>
      <URadioGroup
        v-model="rule"
        orientation="horizontal"
        size="sm"
        :ui="{ label: 'text-xs text-default font-medium' }"
        :items="[
          { label: '按上传时间', value: 'time' },
          { label: '随机', value: 'random' },
        ]"
      />
    </div>

    <!-- 操作按钮 -->
    <div class="flex gap-2">
      <UButton size="sm" color="primary" class="flex-1" @click="scheduleStore.saveSchedule()"> 保存配置 </UButton>
      <UButton size="sm" color="neutral" variant="outline" class="flex-1" @click="scheduleStore.triggerRefresh()">
        立即刷新
      </UButton>
    </div>

    <!-- 下次刷新时间 -->
    <p v-if="nextRefreshTime" class="text-xs text-muted text-center">下次刷新：{{ nextRefreshTime }}</p>
  </div>
</template>
