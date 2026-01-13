/**
 * API 常量配置
 */

// 发布限制
export const PUBLISH_LIMITS = {
  MAX_FILE_SIZE: 500 * 1024, // 500KB
  MAX_TOTAL_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_PER_HOUR: 10,
  MAX_PER_DAY: 50,
  MAX_RESOURCES_PER_PUBLISH: 50,
} as const;

// 命名空间限制
export const NAMESPACE_LIMITS = {
  MAX_PER_USER: 5,
  MIN_LENGTH: 3,
  MAX_LENGTH: 30,
} as const;

// 资源名称限制
export const RESOURCE_LIMITS = {
  MAX_NAME_LENGTH: 50,
  MAX_DESCRIPTION_LENGTH: 500,
} as const;

// Token 配置
export const TOKEN_CONFIG = {
  PREFIX: "asterhub_",
  LENGTH: 32,
  EXPIRY_YEARS: 1,
} as const;

// 缓存 TTL (毫秒)
export const CACHE_TTL = {
  INDEX: 5 * 60 * 1000, // 5 分钟
  RESOURCE: 24 * 60 * 60 * 1000, // 24 小时
} as const;

// 资源类型映射
export const TYPE_MAP: Record<string, string> = {
  components: "ui",
  hooks: "hook",
  lib: "lib",
  configs: "config",
} as const;

// 保留的命名空间
export const RESERVED_NAMESPACES = [
  "asterhub",
  "expo",
  "react",
  "react-native",
  "facebook",
  "google",
  "microsoft",
  "apple",
  "amazon",
  "aws",
  "admin",
  "root",
  "system",
  "official",
  "api",
  "www",
  "app",
  "docs",
  "help",
  "support",
] as const;

// 危险代码模式 (发布时扫描)
export const DANGEROUS_PATTERNS = [
  /eval\s*\(/,
  /new\s+Function\s*\(/,
  /child_process/,
  /require\s*\(\s*['"`]fs/,
  /process\.env/,
  /__dirname|__filename/,
  /fetch\s*\(\s*['"`]http/,
] as const;
