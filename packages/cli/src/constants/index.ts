/**
 * 全局常量
 */

// API 配置
export const API_URL = process.env.ASTER_API_URL || "https://asterhub.dev";

// 默认配置
export const DEFAULT_FRAMEWORK = "expo" as const;
export const DEFAULT_STYLE = "nativewind" as const;

// 文件名
export const CONFIG_FILE = "asterhub.json";
export const CREDENTIALS_FILE = "credentials.json";
export const TRANSACTION_FILE = ".transaction.json";

// 目录
export const ASTER_DIR = ".asterhub";
export const CREDENTIALS_DIR = ".asterhub";

// 限制
export const MAX_PUBLISH_SIZE = 5 * 1024 * 1024; // 5MB
export const REQUEST_TIMEOUT = 60000; // 60s

// 资源类型
export const RESOURCE_TYPES = ["ui", "hook", "lib", "config"] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];
