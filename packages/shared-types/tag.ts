/** 标签 VO */
export interface TagVO {
  /** 标签 ID */
  id: number;
  /** 标签名称 */
  name: string;
  /** 该标签下的照片数量 */
  count: number;
}

/** 标签列表响应 */
export interface TagListResponse {
  items: TagVO[];
}
