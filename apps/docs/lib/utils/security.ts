/**
 * 安全扫描工具
 */
import { DANGEROUS_PATTERNS } from "../constants";

export interface ScanResult {
  safe: boolean;
  warnings: string[];
}

/**
 * 扫描代码中的危险模式
 */
export function scanCode(content: string): ScanResult {
  const warnings: string[] = [];

  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(content)) {
      warnings.push(`检测到潜在危险代码: ${pattern.source}`);
    }
  }

  return {
    safe: warnings.length === 0,
    warnings,
  };
}

/**
 * 扫描多个文件
 */
export function scanFiles(files: Array<{ path: string; content: string }>): ScanResult {
  const allWarnings: string[] = [];

  for (const file of files) {
    const result = scanCode(file.content);
    if (!result.safe) {
      allWarnings.push(...result.warnings.map((w) => `${file.path}: ${w}`));
    }
  }

  return {
    safe: allWarnings.length === 0,
    warnings: allWarnings,
  };
}
