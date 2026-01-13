/**
 * 核心模块类型
 */
import type { ResourceRef, ResourceContent } from "./resource";

// ============================================
// resolver 相关
// ============================================

export interface ResolvedResource {
  ref: ResourceRef;
  content: ResourceContent;
  dependencies: ResourceRef[];
}

export type ResourceFetcher = (ref: ResourceRef) => Promise<ResolvedResource | null>;

// ============================================
// transaction 相关
// ============================================

export interface FileOperation {
  type: "write" | "delete";
  path: string;
  content?: string;
  backup?: string;
}

export interface TransactionState {
  id: string;
  startedAt: string;
  operations: FileOperation[];
  completed: boolean;
}

// ============================================
// security 相关
// ============================================

export type SecuritySeverity = "high" | "medium" | "low";

export interface SecurityIssue {
  severity: SecuritySeverity;
  message: string;
  line?: number;
  code?: string;
}

export interface SecurityReport {
  safe: boolean;
  issues: SecurityIssue[];
  highCount: number;
  mediumCount: number;
  lowCount: number;
}
