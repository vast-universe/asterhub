/**
 * 类型定义统一导出
 */

// 资源类型
export type {
  ResourceType,
  ResourceRef,
  ResourceFile,
  ResourceContent,
  InstalledResource,
  VersionInfo,
} from "./resource";

// 配置类型
export type { Framework, Style, AsterHubConfig } from "./config";

// 认证类型
export type { UserInfo, Credentials, NamespaceInfo } from "./auth";

// Registry 类型
export type { SearchResult, SecurityAdvisory } from "./registry";

// 核心模块类型
export type {
  ResolvedResource,
  ResourceFetcher,
  FileOperation,
  TransactionState,
  SecuritySeverity,
  SecurityIssue,
  SecurityReport,
} from "./core";

// HTTP 类型
export type { RequestOptions, ApiError } from "./http";

// 命令类型
export type {
  TokenInfo,
  CreateOptions,
  FrameworkConfig,
  StarterConfig,
  FeatureConfig,
  TemplateConfig,
  AddOptions,
  ListOptions,
  SearchOptions,
  RemoveOptions,
  UpdateOptions,
  UpdateInfo,
  ViewOptions,
  ResourceConfig,
  RegistryConfig,
  BuildResult,
  PublishOptions,
} from "./commands";
