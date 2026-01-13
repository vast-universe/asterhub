/**
 * HTTP 相关类型
 */

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
  auth?: boolean;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: any;
}
