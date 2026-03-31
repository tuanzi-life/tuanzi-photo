import { defineStore } from "pinia";

export const useScheduleStore = defineStore("schedule", {
  state: () => ({
    mode: "timing" as "timing" | "interval",
    hour: 8,
    intervalHours: 4,
    selectedTags: [] as string[],
    rule: "time" as "time" | "random",
    nextRefreshTime: "明天 08:00",
  }),

  actions: {
    fetchSchedule() {
      // 模拟加载配置
    },

    saveSchedule() {
      // 模拟保存成功
    },

    triggerRefresh() {
      // 模拟立即刷新
    },
  },
});
