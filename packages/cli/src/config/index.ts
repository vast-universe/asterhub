/**
 * 配置统一导出
 */

// 环境配置
export {
  API_URL,
  DEBUG,
  REQUEST_TIMEOUT,
  SCHEMA_URL,
  DOCS_URL,
  getApiUrl,
  debug,
} from "./env";

// 默认配置
export {
  DEFAULT_FRAMEWORK,
  DEFAULT_STYLE,
  DEFAULT_NAMESPACE,
  DEFAULT_ALIASES,
  SUPPORTED_FRAMEWORKS,
  SUPPORTED_STYLES,
  RESOURCE_TYPES,
} from "./defaults";

// 路径配置
export {
  CONFIG_FILE,
  CREDENTIALS_FILE,
  TRANSACTION_FILE,
  ASTERHUB_DIR,
  getHomeDir,
  getCredentialsPath,
  getConfigPath,
  getTransactionPath,
} from "./paths";

// 限制配置
export {
  MAX_PUBLISH_SIZE,
  MAX_FILE_SIZE,
  NAMESPACE_MIN_LENGTH,
  NAMESPACE_MAX_LENGTH,
  COMPONENT_MIN_LENGTH,
  COMPONENT_MAX_LENGTH,
  VERSION_REGEX,
  NAMESPACE_REGEX,
  COMPONENT_NAME_REGEX,
} from "./limits";
