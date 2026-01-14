/**
 * 安全检查工具
 */
import { logger } from "../lib";
import type { SecurityIssue, SecurityReport, SecuritySeverity } from "../types";

/**
 * 危险模式列表
 */
const DANGEROUS_PATTERNS: Array<{ pattern: RegExp; severity: SecuritySeverity; message: string }> = [
  // 代码执行
  { pattern: /\beval\s*\(/gi, severity: "high", message: "使用 eval() 执行代码" },
  { pattern: /\bnew\s+Function\s*\(/gi, severity: "high", message: "使用 new Function()" },
  { pattern: /\bexec\s*\(/gi, severity: "high", message: "可能执行系统命令" },

  // 文件系统
  { pattern: /\bfs\.(unlink|rmdir|rm)\s*\(/gi, severity: "high", message: "删除文件操作" },
  { pattern: /require\s*\(\s*['"`]child_process['"`]\s*\)/gi, severity: "high", message: "导入 child_process" },

  // 网络请求
  { pattern: /\bfetch\s*\(/gi, severity: "low", message: "网络请求" },
  { pattern: /\bWebSocket\b/gi, severity: "low", message: "WebSocket 连接" },

  // 敏感数据
  { pattern: /process\.env\[/gi, severity: "medium", message: "访问环境变量" },

  // 危险 URL
  { pattern: /javascript:/gi, severity: "high", message: "JavaScript URL" },

  // React Native 特定
  { pattern: /\bNativeModules\b/gi, severity: "medium", message: "访问原生模块" },
];

/**
 * 扫描代码安全问题
 */
export function scanCode(code: string): SecurityReport {
  const issues: SecurityIssue[] = [];
  const lines = code.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    for (const { pattern, severity, message } of DANGEROUS_PATTERNS) {
      pattern.lastIndex = 0;

      if (pattern.test(line)) {
        issues.push({
          severity,
          message,
          line: i + 1,
          code: line.trim().slice(0, 80),
        });
      }
    }
  }

  const highCount = issues.filter((i) => i.severity === "high").length;
  const mediumCount = issues.filter((i) => i.severity === "medium").length;
  const lowCount = issues.filter((i) => i.severity === "low").length;

  return {
    safe: highCount === 0,
    issues,
    highCount,
    mediumCount,
    lowCount,
  };
}

/**
 * 扫描组件
 */
export function scanComponent(component: any): SecurityReport {
  const allIssues: SecurityIssue[] = [];

  // 扫描所有文件
  if (component.files && Array.isArray(component.files)) {
    for (const file of component.files) {
      if (file.content) {
        const report = scanCode(file.content);
        allIssues.push(
          ...report.issues.map((i) => ({
            ...i,
            message: `[${file.path}] ${i.message}`,
          }))
        );
      }
    }
  }

  const highCount = allIssues.filter((i) => i.severity === "high").length;
  const mediumCount = allIssues.filter((i) => i.severity === "medium").length;
  const lowCount = allIssues.filter((i) => i.severity === "low").length;

  return {
    safe: highCount === 0,
    issues: allIssues,
    highCount,
    mediumCount,
    lowCount,
  };
}

/**
 * 打印安全报告
 */
export function printSecurityReport(report: SecurityReport, verbose = false): void {
  if (report.safe && report.issues.length === 0) {
    logger.success("未发现安全问题");
    return;
  }

  if (report.highCount > 0) {
    logger.error(`高风险: ${report.highCount}`);
  }
  if (report.mediumCount > 0) {
    logger.warn(`中风险: ${report.mediumCount}`);
  }
  if (report.lowCount > 0) {
    logger.dim(`低风险: ${report.lowCount}`);
  }

  if (verbose) {
    logger.newline();
    for (const issue of report.issues) {
      const prefix =
        issue.severity === "high" ? "✖" : issue.severity === "medium" ? "⚠" : "ℹ";
      logger.dim(`  ${prefix} ${issue.message}`);
      if (issue.code) {
        logger.dim(`    ${issue.code}`);
      }
    }
  }
}

/**
 * 验证命名空间格式
 */
export function validateNamespace(namespace: string): { valid: boolean; error?: string } {
  if (!namespace) {
    return { valid: false, error: "命名空间不能为空" };
  }

  if (namespace.length < 2 || namespace.length > 32) {
    return { valid: false, error: "命名空间长度需要在 2-32 个字符之间" };
  }

  if (!/^[a-z][a-z0-9_-]*$/.test(namespace)) {
    return { valid: false, error: "命名空间只能包含小写字母、数字、下划线和连字符" };
  }

  const reserved = ["asterhub", "official", "admin", "api", "www", "app", "docs"];
  if (reserved.includes(namespace)) {
    return { valid: false, error: `"${namespace}" 是保留名称` };
  }

  return { valid: true };
}

/**
 * 验证组件名称格式
 */
export function validateComponentName(name: string): { valid: boolean; error?: string } {
  if (!name) {
    return { valid: false, error: "组件名称不能为空" };
  }

  if (name.length < 2 || name.length > 64) {
    return { valid: false, error: "组件名称长度需要在 2-64 个字符之间" };
  }

  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    return { valid: false, error: "组件名称只能包含小写字母、数字和连字符" };
  }

  return { valid: true };
}
