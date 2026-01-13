/**
 * 资源相关类型
 */
import type { ResourceType } from "./common";

// 资源引用
export interface ResourceRef {
  namespace: string;
  type: ResourceType;
  name: string;
  version?: string;
}

// 资源文件
export interface ResourceFile {
  path: string;
  content: string;
  type: string;
}

// 资源内容
export interface ResourceContent {
  name: string;
  type: ResourceType;
  version: string;
  description?: string;
  files: ResourceFile[];
  dependencies?: string[];
  registryDependencies?: string[];
  devDependencies?: string[];
  meta?: Record<string, unknown>;
}

// 已安装资源
export interface InstalledResource {
  version: string;
  namespace: string;
  installedAt: string;
  integrity?: string;
}

// 搜索结果
export interface SearchResult {
  namespace: string;
  name: string;
  type: ResourceType;
  description?: string;
  downloads: number;
  latestVersion: string;
}

// 版本信息
export interface VersionInfo {
  version: string;
  publishedAt: string;
  downloads: number;
}

// 安全公告
export interface SecurityAdvisory {
  namespace: string;
  name: string;
  type: ResourceType;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  affectedVersions: string;
  patchedVersion?: string;
}
