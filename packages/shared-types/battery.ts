export type BatteryStatus = "charging" | "discharging" | "idle" | "full";

export interface BatteryVO {
  percent: number;
  voltage: number;
  current_mA: number;
  power_W: number;
  status: BatteryStatus;
}
