/**
 * 工具模块统一导出
 */
export { scanCode, scanFiles, type ScanResult } from "./security";
export { sha256, computeIntegrity } from "./hash";

// UI 工具函数
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
