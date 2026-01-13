/**
 * 命令相关类型
 */
import type { ResourceType } from "./resource";

// ============================================
// Token 相关
// ============================================

export interface TokenInfo {
  id: string;
  name: string;
  scopes?: string[];
  createdAt?: string;
  lastUsedAt?: string;
  expiresAt?: string;
}

// ============================================
// create 命令
// ============================================

export interface CreateOptions {
  framework?: string;
  starter?: string;
  features?: string[];
  yes?: boolean;
}

export interface FrameworkConfig {
  name: string;
  description: string;
  path: string;
  status: string;
  baseCommand: string;
}

export interface StarterConfig {
  name: string;
  description: string;
  path: string;
  features: string[];
}

export interface FeatureConfig {
  name: string;
  description: string;
  path: string;
  dependencies?: string[];
  devDependencies?: string[];
  expoDependencies?: string[];
  npmDependencies?: string[];
  overrides?: Record<string, string>;
}

export interface TemplateConfig {
  features: Record<string, FeatureConfig>;
  starters: Record<string, StarterConfig>;
  presets: Record<string, string[]>;
}

// ============================================
// add 命令
// ============================================

export interface AddOptions {
  force?: boolean;
  skipSecurity?: boolean;
}

// ============================================
// list 命令
// ============================================

export interface ListOptions {
  installed?: boolean;
  configs?: boolean;
  hooks?: boolean;
  lib?: boolean;
}

// ============================================
// search 命令
// ============================================

export interface SearchOptions {
  type?: string;
  namespace?: string;
}

// ============================================
// remove 命令
// ============================================

export interface RemoveOptions {
  yes?: boolean;
}

// ============================================
// update 命令
// ============================================

export interface UpdateOptions {
  all?: boolean;
  force?: boolean;
}

export interface UpdateInfo {
  type: string;
  name: string;
  namespace: string;
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
}

// ============================================
// view 命令
// ============================================

export interface ViewOptions {
  file?: string;
}

// ============================================
// registry 命令
// ============================================

export interface ResourceConfig {
  name: string;
  version: string;
  style?: string;
  description?: string;
  files: string[];
  dependencies?: string[];
  devDependencies?: string[];
  registryDependencies?: string[];
  transforms?: any[];
  postInstall?: string[];
}

export interface RegistryConfig {
  namespace: string;
  description?: string;
  frameworks: string[];
  components?: ResourceConfig[];
  hooks?: ResourceConfig[];
  lib?: ResourceConfig[];
  configs?: ResourceConfig[];
}

export interface BuildResult {
  name: string;
  type: ResourceType;
  style?: string;
  description?: string;
  latest: string;
  versions: string[];
}

export interface PublishOptions {
  namespace?: string;
  dryRun?: boolean;
}
