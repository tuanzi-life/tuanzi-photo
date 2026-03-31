/**
 * 定时刷新配置 VO
 */
export interface ScheduleVO {
  /** 刷新模式：timing 每天定时 | interval 每隔 N 小时 */
  refreshMode: "timing" | "interval";
  /** 每天定时模式：整点小时数（0-23） */
  timingHour: number;
  /** 间隔模式：间隔小时数（1-24） */
  intervalHours: number;
  /** 刷新规则：time 按上传时间顺序 | random 随机 */
  refreshRule: "time" | "random";
  /** 适用标签名数组（空数组表示不限制） */
  relatedTags: string[];
  /** 下次刷新时间（Unix 秒，实时计算） */
  nextRefreshTime: number;
}

/** 更新定时配置的请求体 */
export interface UpdateScheduleBody {
  refreshMode: "timing" | "interval";
  timingHour: number;
  intervalHours: number;
  refreshRule: "time" | "random";
  relatedTags: string[];
}
