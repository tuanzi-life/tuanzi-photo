import { defineStore } from "pinia";
import { useToast } from "@nuxt/ui/composables/useToast";
import type { ApiResponse, ScheduleVO, UpdateScheduleBody } from "@tuanzi-photo/shared-types";

export const useScheduleStore = defineStore("schedule", {
  state: () => ({
    refreshMode: "timing" as "timing" | "interval",
    timingHour: 8,
    intervalHours: 4,
    relatedTags: [] as string[],
    refreshRule: "time" as "time" | "random",
    nextRefreshTime: 0,
  }),

  actions: {
    async fetchSchedule() {
      const toast = useToast();
      try {
        const res = await fetch("/api/v1/schedule");
        const body: ApiResponse<ScheduleVO> = await res.json();
        if (body.code === 0) {
          const d = body.data;
          this.refreshMode = d.refreshMode;
          this.timingHour = d.timingHour;
          this.intervalHours = d.intervalHours;
          this.relatedTags = d.relatedTags;
          this.refreshRule = d.refreshRule;
          this.nextRefreshTime = d.nextRefreshTime;
        } else {
          toast.add({ title: body.message, color: "error" });
        }
      } catch {
        toast.add({ title: "加载配置失败，请检查网络", color: "error" });
      }
    },

    async saveSchedule() {
      const toast = useToast();
      const body: UpdateScheduleBody = {
        refreshMode: this.refreshMode,
        timingHour: this.timingHour,
        intervalHours: this.intervalHours,
        refreshRule: this.refreshRule,
        relatedTags: this.relatedTags,
      };
      try {
        const res = await fetch("/api/v1/schedule", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const resBody: ApiResponse<ScheduleVO> = await res.json();
        if (resBody.code === 0) {
          const d = resBody.data;
          this.refreshMode = d.refreshMode;
          this.timingHour = d.timingHour;
          this.intervalHours = d.intervalHours;
          this.relatedTags = d.relatedTags;
          this.refreshRule = d.refreshRule;
          this.nextRefreshTime = d.nextRefreshTime;
          toast.add({ title: "保存成功", color: "success" });
        } else {
          toast.add({ title: resBody.message, color: "error" });
        }
      } catch {
        toast.add({ title: "保存失败，请检查网络", color: "error" });
      }
    },

    async triggerRefresh() {
      const toast = useToast();
      try {
        const res = await fetch("/api/v1/schedule/trigger", { method: "POST" });
        const body: ApiResponse<null> = await res.json();
        if (body.code === 0) {
          toast.add({ title: "已触发刷新，正在刷新", color: "success" });
        } else if (body.code === 409) {
          toast.add({ title: "墨水屏正在刷新，请稍后再试", color: "warning" });
        } else if (body.code === 404) {
          toast.add({ title: "没有可用的照片", color: "warning" });
        } else {
          toast.add({ title: body.message, color: "error" });
        }
      } catch {
        toast.add({ title: "触发刷新失败，请检查网络", color: "error" });
      }
    },
  },
});
