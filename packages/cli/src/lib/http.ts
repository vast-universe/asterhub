/**
 * HTTP 客户端 - 统一的网络请求
 */
import { API_URL, REQUEST_TIMEOUT } from "../constants";
import { getToken } from "./auth";
import type { RequestOptions, ApiError } from "../types";

class HttpError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: ApiError
  ) {
    super(data?.error || statusText);
    this.name = "HttpError";
  }
}

/**
 * 发送 HTTP 请求
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {}, timeout = REQUEST_TIMEOUT, auth = false } = options;

  const url = path.startsWith("http") ? path : `${API_URL}${path}`;

  // 构建请求头
  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  // 添加认证头
  if (auth) {
    const token = await getToken();
    if (token) {
      requestHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  // 发送请求
  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(timeout),
  });

  // 处理响应
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new HttpError(response.status, response.statusText, data);
  }

  return response.json();
}

/**
 * GET 请求
 */
export function get<T>(path: string, options?: Omit<RequestOptions, "method" | "body">): Promise<T> {
  return request<T>(path, { ...options, method: "GET" });
}

/**
 * POST 请求
 */
export function post<T>(path: string, body?: any, options?: Omit<RequestOptions, "method">): Promise<T> {
  return request<T>(path, { ...options, method: "POST", body });
}

/**
 * PUT 请求
 */
export function put<T>(path: string, body?: any, options?: Omit<RequestOptions, "method">): Promise<T> {
  return request<T>(path, { ...options, method: "PUT", body });
}

/**
 * DELETE 请求
 */
export function del<T>(path: string, options?: Omit<RequestOptions, "method" | "body">): Promise<T> {
  return request<T>(path, { ...options, method: "DELETE" });
}

export { HttpError };
