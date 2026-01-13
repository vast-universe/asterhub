/**
 * Core 模块统一导出
 */

// 依赖解析
export { DependencyResolver, parseResourceRef, getResourceKey } from "./resolver";

// 事务管理
export { InstallTransaction, recoverTransaction } from "./transaction";

// 安全检查
export {
  scanCode,
  scanComponent,
  printSecurityReport,
  validateNamespace,
  validateComponentName,
} from "./security";

// 类型从 types 模块导出
export type {
  ResolvedResource,
  ResourceFetcher,
  FileOperation,
  TransactionState,
  SecurityIssue,
  SecurityReport,
  SecuritySeverity,
} from "../types";
