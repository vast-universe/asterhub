/**
 * 类型定义统一导出
 */

// 通用类型
export type { ResourceType, Framework, Style } from "./common";

// 资源类型
export type {
  ResourceRef,
  ResourceFile,
  ResourceContent,
  InstalledResource,
  SearchResult,
  VersionInfo,
  SecurityAdvisory,
} from "./resource";

// 配置类型
export type { AsterHubConfig } from "./config";

// 认证类型
export type { UserInfo, Credentials, NamespaceInfo } from "./auth";

// Registry 类型
export type {
  RegistryConfig,
  ComponentConfig,
  HookConfig,
  LibConfig,
  ConfigConfig,
} from "./registry";
