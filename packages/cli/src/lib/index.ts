/**
 * Lib 模块统一导出
 */

// 日志
export { logger } from "./logger";

// HTTP 客户端
export { request, get, post, put, del, HttpError } from "./http";

// 文件系统
export * as fs from "./fs";

// 认证
export {
  readCredentials,
  writeCredentials,
  clearCredentials,
  getToken,
  getUserInfo,
  isLoggedIn,
} from "./auth";

// 配置
export {
  readConfig,
  writeConfig,
  ensureConfig,
  hasConfig,
  markInstalled,
  markRemoved,
  getInstalledResources,
  isInstalled,
  getConfigValue,
} from "./config";
