/**
 * Registry 相关类型
 */
import type { ResourceType } from "./resource";

// 搜索结果
export interface SearchResult {
  namespace: string;
  name: string;
  type: ResourceType;
  description?: string;
  downloads: number;
  latestVersion: string;
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
