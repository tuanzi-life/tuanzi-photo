import type { ApiResponse, ApiCode } from "@tuanzi-photo/shared-types";

export function ok<T>(data: T): ApiResponse<T> {
  return { code: 0, message: "ok", data };
}

export function err(code: Exclude<ApiCode, 0>, message: string): ApiResponse<null> {
  return { code, message, data: null };
}
