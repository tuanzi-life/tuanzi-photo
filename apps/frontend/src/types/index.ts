import type { PhotoVO, ScheduleVO } from "@tuanzi-photo/shared-types";

/** 前端照片类型，扩展 PhotoVO 增加缩略图 URL */
export interface Photo extends PhotoVO {
  thumbnailUrl: string;
  filename: string;
}

/** 前端定时任务配置类型 */
export interface ScheduleConfig extends ScheduleVO {
  intervalHours: number;
  nextRefreshTime: string | null;
}
