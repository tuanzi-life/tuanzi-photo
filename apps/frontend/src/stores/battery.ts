import { defineStore } from "pinia";
import type { ApiResponse, BatteryStatus, BatteryVO } from "@tuanzi-photo/shared-types";

const pollingIntervalMs = 10000;

export const useBatteryStore = defineStore("battery", {
  state: () => ({
    percent: null as number | null,
    status: null as BatteryStatus | null,
  }),

  getters: {
    iconName(state) {
      if (state.status === "charging") {
        return "i-lucide-battery-charging";
      }

      if (state.status === "full") {
        return "i-lucide-battery-full";
      }

      return "i-lucide-battery-medium";
    },
  },

  actions: {
    async fetchBattery() {
      try {
        const res = await fetch("/api/v1/battery");
        const body: ApiResponse<BatteryVO> = await res.json();
        if (body.code === 0) {
          this.percent = body.data.percent;
          this.status = body.data.status;
        }
      } catch {
        // 静默降级，开发机或硬件不可用时不打扰用户
      }
    },

    startPolling() {
      void this.fetchBattery();

      const timerId = window.setInterval(() => {
        void this.fetchBattery();
      }, pollingIntervalMs);

      return () => {
        window.clearInterval(timerId);
      };
    },
  },
});
