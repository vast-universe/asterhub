/**
 * 哈希工具
 */
import { createHash } from "crypto";

/**
 * 计算 SHA256 哈希
 */
export function sha256(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

/**
 * 计算完整性哈希 (SRI 格式)
 */
export function computeIntegrity(content: string): string {
  return "sha256-" + createHash("sha256").update(content).digest("base64");
}
