/**
 * 照片 VO
 */
export interface PhotoVO {
  /** 照片 ID */
  id: number;
  /** 文件名 */
  filename: string;
  /** 照片 URL */
  url: string;
  /** 标签名称列表 */
  tags: string[];
  /** 创建时间（Unix 秒） */
  createdAt: number;
}

/** 照片列表响应 */
export interface PhotoListResponse {
  total: number;
  items: PhotoVO[];
}
