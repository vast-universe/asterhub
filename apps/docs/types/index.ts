/**
 * 共享类型定义
 */

// =====================================================
// 用户相关
// =====================================================

export interface User {
  id: number;
  github_id: string;
  github_username: string;
  email?: string;
  avatar_url?: string;
  created_at: Date;
}

export interface CreateUserData {
  githubId: string;
  githubUsername: string;
  email?: string;
  avatarUrl?: string;
}

// =====================================================
// Token 相关
// =====================================================

export interface Token {
  id: number;
  user_id: number;
  token_hash: string;
  name?: string;
  scopes: string[];
  created_at: Date;
  expires_at?: Date;
  last_used_at?: Date;
  revoked: boolean;
}

export type TokenScope =
  | "read"
  | "publish"
  | "delete"
  | "namespace:create"
  | "namespace:delete";

// =====================================================
// 命名空间相关
// =====================================================

export interface Namespace {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  is_default: boolean;
  verified: boolean;
  created_at: Date;
}

// =====================================================
// Registry 相关
// =====================================================

export interface RegistryItem {
  id: number;
  namespace_id: number;
  name: string;
  type: string;
  style?: string;
  description?: string;
  keywords?: string[];
  latest_version?: string;
  total_downloads: number;
  is_official: boolean;
  deprecated: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface RegistryVersion {
  id: number;
  item_id: number;
  version: string;
  r2_path: string;
  file_size?: number;
  integrity?: string;
  downloads: number;
  deprecated: boolean;
  published_at: Date;
}

export interface UpsertRegistryItemData {
  namespaceId: number;
  name: string;
  type: string;
  style?: string;
  description?: string;
  keywords?: string[];
  latestVersion: string;
  isOfficial?: boolean;
}

export interface CreateVersionData {
  itemId: number;
  version: string;
  r2Path: string;
  fileSize?: number;
  integrity?: string;
}

// =====================================================
// 搜索相关
// =====================================================

export interface SearchOptions {
  type?: string;
  style?: string;
  namespace?: string;
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  namespace: string;
  name: string;
  type: string;
  style?: string;
  description?: string;
  latestVersion?: string;
  downloads: number;
  isOfficial: boolean;
}

export interface SearchResponse {
  items: SearchResult[];
  total: number;
}

// =====================================================
// 发布相关
// =====================================================

export interface PublishLogData {
  userId: number;
  namespaceId: number;
  itemCount: number;
  totalSize: number;
  ipAddress?: string;
}

export interface PublishResource {
  name: string;
  type: string;
  style?: string;
  version: string;
  content: Record<string, unknown>;
}

// =====================================================
// 安全相关
// =====================================================

export interface SecurityAdvisory {
  id: number;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description?: string;
  affected_items: number[];
  affected_versions?: string[];
  patched_version?: string;
  published_at?: Date;
}

// =====================================================
// API 响应
// =====================================================

export interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}
