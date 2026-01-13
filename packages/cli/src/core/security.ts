/**
 * 安全检查模块
 */
import { logger } from "../lib/logger";

interface SecurityCheckResult {
  passed: boolean;
  warnings: string[];
  errors: string[];
}

/**
 * 危险模式列表
 */
const DANGEROUS_PATTERNS = [
  /eval\s*\(/,
  /new\s+Function\s*\(/,
  /document\.write/,
  /innerHTML\s*=/,
  /dangerouslySetInnerHTML/,
  /child_process/,
  /require\s*\(\s*['"`]fs['"`]\s*\)/,
  /process\.env/,
  /__dirname/,
  /__filename/,
];

/**
 * 检查代码安全性
 */
export function checkCodeSecurity(code: string): SecurityCheckResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(code)) {
      warnings.push(`发现潜在危险代码: ${pattern.source}`);
    }
  }

  return {
    passed: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * 检查资源安全性
 */
export async function checkResourceSecurity(
  files: Array<{ path: string; content: string }>
): Promise<SecurityCheckResult> {
  const allWarnings: string[] = [];
  const allErrors: string[] = [];

  for (const file of files) {
    const result = checkCodeSecurity(file.content);
    allWarnings.push(...result.warnings.map((w) => `${file.path}: ${w}`));
    allErrors.push(...result.errors.map((e) => `${file.path}: ${e}`));
  }

  return {
    passed: allErrors.length === 0,
    warnings: allWarnings,
    errors: allErrors,
  };
}

/**
 * 显示安全检查结果
 */
export function displaySecurityResult(result: SecurityCheckResult): void {
  if (result.warnings.length > 0) {
    logger.warn("安全检查警告:");
    result.warnings.forEach((w) => logger.warn(`  - ${w}`));
  }

  if (result.errors.length > 0) {
    logger.error("安全检查错误:");
    result.errors.forEach((e) => logger.error(`  - ${e}`));
  }

  if (result.passed && result.warnings.length === 0) {
    logger.success("安全检查通过");
  }
}
