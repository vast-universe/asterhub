/**
 * 常量统一导出 (从 config 模块重新导出)
 * @deprecated 请直接从 ../config 导入
 */

// 环境配置
export { API_URL, GITHUB_CLIENT_ID, REQUEST_TIMEOUT, DEBUG, debug } from "../config/env";

// 默认配置
export { DEFAULT_FRAMEWORK, DEFAULT_STYLE, RESOURCE_TYPES } from "../config/defaults";

// 路径配置
export {
  CONFIG_FILE,
  CREDENTIALS_FILE,
  TRANSACTION_FILE,
  ASTERHUB_DIR as ASTER_DIR,
  ASTERHUB_DIR as CREDENTIALS_DIR,
} from "../config/paths";

// 限制配置
export { MAX_PUBLISH_SIZE } from "../config/limits";

// 类型
export type { ResourceType } from "../types";
