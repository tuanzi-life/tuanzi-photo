<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useScheduleStore } from "../stores/schedule";

const scheduleStore = useScheduleStore();
const { mode, hour, intervalHours, rule, nextRefreshTime } = storeToRefs(scheduleStore);

const isOpen = defineModel<boolean>("open", { default: false });

const hourOptions = Array.from({ length: 24 }, (_, i) => ({
  label: `${String(i).padStart(2, "0")}:00`,
  value: i,
}));
</script>

<template>
  <USlideover v-model:open="isOpen" side="bottom" title="定时刷新">
    <div class="p-4 flex flex-col gap-4">
      <!-- 模式 -->
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

      <!-- 时间 -->
      <div v-if="mode === 'timing'">
        <label class="text-sm text-muted mb-1 block">刷新时间</label>
        <USelect v-model="hour" :items="hourOptions" />
      </div>
      <div v-else>
        <label class="text-sm text-muted mb-1 block">间隔小时数</label>
        <UInput v-model="intervalHours" type="number" :min="1" :max="24" />
      </div>

      <!-- 规则 -->
      <div>
        <label class="text-sm text-muted mb-2 block">刷新规则</label>
        <URadioGroup
          v-model="rule"
          orientation="horizontal"
          size="sm"
          :ui="{ label: 'text-sm text-default' }"
          :items="[
            { label: '按上传时间', value: 'time' },
            { label: '随机', value: 'random' },
          ]"
        />
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
