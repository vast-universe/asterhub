/**
 * Registry 配置类型 (用于 registry.config.ts)
 */
import type { Framework, Style } from "./common";

// Registry 配置
export interface RegistryConfig {
  namespace: string;
  description?: string;
  frameworks: Framework[];
  components?: ComponentConfig[];
  hooks?: HookConfig[];
  lib?: LibConfig[];
  configs?: ConfigConfig[];
}

// 组件配置
export interface ComponentConfig {
  name: string;
  version: string;
  style: Style;
  description?: string;
  files: string[];
  dependencies?: string[];
  devDependencies?: string[];
  registryDependencies?: string[];
}

// Hook 配置
export interface HookConfig {
  name: string;
  version: string;
  description?: string;
  files: string[];
  dependencies?: string[];
  devDependencies?: string[];
  registryDependencies?: string[];
}

// Lib 配置
export interface LibConfig {
  name: string;
  version: string;
  description?: string;
  files: string[];
  dependencies?: string[];
  devDependencies?: string[];
}

// Config 配置
export interface ConfigConfig {
  name: string;
  version: string;
  description?: string;
  files: string[];
}
