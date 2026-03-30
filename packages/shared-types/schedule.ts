/**
 * 定时刷新VO
 */
export interface ScheduleVO {
  /** 刷新模式 */
  refreshMode: "timing" | "interval";
  /** 刷新时间 */
  refreshTime: string;
  /** 刷新规则 */
  refreshRule: "time" | "random";
  /** 标签列表 */
  tags: string[];
}
