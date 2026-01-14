/**
 * 环境变量配置
 * 
 * 支持的环境变量:
 * - ASTERHUB_API_URL: API 地址 (默认: https://asterhub.dev)
 * - ASTERHUB_DEBUG: 开启调试模式 (默认: false)
 * - ASTERHUB_TIMEOUT: 请求超时时间 (默认: 60000ms)
 */

// API 地址
export const API_URL = process.env.ASTERHUB_API_URL || "https://asterhub.dev";

// 调试模式
export const DEBUG = process.env.ASTERHUB_DEBUG === "true" || process.env.ASTERHUB_DEBUG === "1";

// 请求超时 (毫秒)
export const REQUEST_TIMEOUT = parseInt(process.env.ASTERHUB_TIMEOUT || "60000", 10);

// Schema URL
export const SCHEMA_URL = `${API_URL}/schema/asterhub.json`;

// 文档 URL
export const DOCS_URL = `${API_URL}/docs`;

/**
 * 获取完整 API URL
 */
export function getApiUrl(path: string): string {
  const base = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

/**
 * 打印调试信息
 */
export function debug(...args: unknown[]): void {
  if (DEBUG) {
    console.log("[DEBUG]", ...args);
  }
}
