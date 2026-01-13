/**
 * 资源相关类型
 */

// 资源类型
export type ResourceType = "ui" | "hook" | "lib" | "config";

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

// 版本信息
export interface VersionInfo {
  version: string;
  publishedAt: string;
  downloads: number;
}
