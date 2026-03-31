<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useScheduleStore } from "../stores/schedule";
import { usePhotoStore } from "../stores/photo";

const scheduleStore = useScheduleStore();
const photoStore = usePhotoStore();
const { mode, time, intervalHours, selectedTags, rule, nextRefreshTime } = storeToRefs(scheduleStore);
const { allTags } = storeToRefs(photoStore);
</script>

<template>
  <div class="flex flex-col gap-4">
    <p class="text-xs font-medium text-muted uppercase tracking-wide">定时刷新</p>

    <!-- 模式切换 -->
    <div class="flex gap-2">
      <UButton
        size="sm"
        :color="mode === 'daily' ? 'primary' : 'neutral'"
        :variant="mode === 'daily' ? 'solid' : 'outline'"
        @click="mode = 'daily'"
      >
        每天定时
      </UButton>
      <UButton
        size="sm"
        :color="mode === 'interval' ? 'primary' : 'neutral'"
        :variant="mode === 'interval' ? 'solid' : 'outline'"
        @click="mode = 'interval'"
      >
        每隔 N 小时
      </UButton>
    </div>

    <!-- 时间配置 -->
    <div v-if="mode === 'daily'">
      <label class="text-sm text-muted mb-1 block">刷新时间</label>
      <UInput v-model="time" type="time" size="sm" />
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
      <div class="flex gap-2">
        <button
          class="flex-1 py-2 px-3 rounded-md border text-sm transition-colors"
          :class="rule === 'time' ? 'border-primary text-primary bg-primary/5' : 'border-default text-muted'"
          @click="rule = 'time'"
        >
          按上传时间
        </button>
        <button
          class="flex-1 py-2 px-3 rounded-md border text-sm transition-colors"
          :class="rule === 'random' ? 'border-primary text-primary bg-primary/5' : 'border-default text-muted'"
          @click="rule = 'random'"
        >
          随机
        </button>
      </div>
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
