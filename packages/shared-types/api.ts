export type ApiCode =
  | 0
  | 400
  | 401
  | 403
  | 404
  | 409
  | 429
  | 500;

export interface ApiResponse<T = unknown> {
  code: ApiCode;
  message: string;
  data: T;
}
