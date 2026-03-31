<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useScheduleStore } from "../stores/schedule";

const scheduleStore = useScheduleStore();
const { mode, time, intervalHours, rule, nextRefreshTime } = storeToRefs(scheduleStore);

const isOpen = defineModel<boolean>("open", { default: false });
</script>

<template>
  <USlideover v-model:open="isOpen" side="bottom" title="定时刷新">
    <div class="p-4 flex flex-col gap-4">
      <!-- 模式 -->
      <div class="flex gap-2">
        <UButton
          size="sm"
          :color="mode === 'daily' ? 'primary' : 'neutral'"
          :variant="mode === 'daily' ? 'solid' : 'outline'"
          class="flex-1"
          @click="mode = 'daily'"
        >
          每天定时
        </UButton>
        <UButton
          size="sm"
          :color="mode === 'interval' ? 'primary' : 'neutral'"
          :variant="mode === 'interval' ? 'solid' : 'outline'"
          class="flex-1"
          @click="mode = 'interval'"
        >
          每隔 N 小时
        </UButton>
      </div>

      <!-- 时间 -->
      <div v-if="mode === 'daily'">
        <label class="text-sm text-muted mb-1 block">刷新时间</label>
        <UInput v-model="time" type="time" />
      </div>
      <div v-else>
        <label class="text-sm text-muted mb-1 block">间隔小时数</label>
        <UInput v-model="intervalHours" type="number" :min="1" :max="24" />
      </div>

      <!-- 规则 -->
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

      <p v-if="nextRefreshTime" class="text-xs text-muted text-center">下次刷新：{{ nextRefreshTime }}</p>

      <div class="flex gap-2">
        <UButton
          color="primary"
          class="flex-1"
          @click="
            scheduleStore.saveSchedule();
            isOpen = false;
          "
        >
          保存
        </UButton>
        <UButton color="neutral" variant="outline" class="flex-1" @click="scheduleStore.triggerRefresh()">
          立即刷新
        </UButton>
      </div>
    </div>
  </USlideover>
</template>
