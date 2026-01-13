/**
 * 验证工具
 */
import { NAMESPACE_LIMITS, RESERVED_NAMESPACES, RESOURCE_LIMITS } from "../constants";
import type { ValidationResult } from "@/types";

/**
 * 验证命名空间名称
 */
export function validateNamespaceName(name: string): ValidationResult {
  if (!name) {
    return { valid: false, error: "名称不能为空" };
  }

  const pattern = new RegExp(
    `^[a-z0-9-]{${NAMESPACE_LIMITS.MIN_LENGTH},${NAMESPACE_LIMITS.MAX_LENGTH}}$`
  );
  if (!pattern.test(name)) {
    return {
      valid: false,
      error: `名称只能包含小写字母、数字和连字符，长度 ${NAMESPACE_LIMITS.MIN_LENGTH}-${NAMESPACE_LIMITS.MAX_LENGTH}`,
    };
  }

  if (RESERVED_NAMESPACES.includes(name as (typeof RESERVED_NAMESPACES)[number])) {
    return { valid: false, error: "该名称已被保留" };
  }

  return { valid: true };
}

/**
 * 验证资源名称
 */
export function validateResourceName(name: string): ValidationResult {
  if (!name) {
    return { valid: false, error: "资源名称不能为空" };
  }

  if (name.length > RESOURCE_LIMITS.MAX_NAME_LENGTH) {
    return {
      valid: false,
      error: `资源名称不能超过 ${RESOURCE_LIMITS.MAX_NAME_LENGTH} 个字符`,
    };
  }

  if (!/^[a-z0-9-]+$/.test(name)) {
    return { valid: false, error: "资源名称只能包含小写字母、数字和连字符" };
  }

  return { valid: true };
}

/**
 * 验证版本号
 */
export function validateVersion(version: string): ValidationResult {
  if (!version) {
    return { valid: false, error: "版本号不能为空" };
  }

  if (!/^\d+\.\d+\.\d+(-[a-z0-9.]+)?$/.test(version)) {
    return { valid: false, error: "版本号格式不正确，应为 x.y.z 格式" };
  }

  return { valid: true };
}

/**
 * 验证描述
 */
export function validateDescription(description: string): ValidationResult {
  if (description && description.length > RESOURCE_LIMITS.MAX_DESCRIPTION_LENGTH) {
    return {
      valid: false,
      error: `描述不能超过 ${RESOURCE_LIMITS.MAX_DESCRIPTION_LENGTH} 个字符`,
    };
  }

  return { valid: true };
}
