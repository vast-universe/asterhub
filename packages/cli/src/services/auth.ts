/**
 * 认证服务 - 用户认证 API
 */
import { get, post } from "../lib/http";
import type { UserInfo, NamespaceInfo } from "../types";

/**
 * 获取当前用户信息
 */
export async function fetchCurrentUser(): Promise<UserInfo> {
  return get<UserInfo>("/api/auth/me", { auth: true });
}

/**
 * 验证 Token
 */
export async function verifyToken(token: string): Promise<UserInfo> {
  return get<UserInfo>("/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

/**
 * 获取用户的命名空间列表
 */
export async function fetchNamespaces(): Promise<NamespaceInfo[]> {
  const result = await get<{ namespaces: NamespaceInfo[] }>("/api/auth/namespaces", { auth: true });
  return result.namespaces || [];
}

/**
 * 创建命名空间
 */
export async function createNamespace(
  name: string,
  options?: { displayName?: string; description?: string }
): Promise<NamespaceInfo> {
  return post<NamespaceInfo>("/api/auth/namespaces", { name, ...options }, { auth: true });
}

/**
 * 删除命名空间
 */
export async function deleteNamespace(name: string): Promise<void> {
  const { del } = await import("../lib/http");
  await del(`/api/auth/namespaces/${name}`, { auth: true });
}

/**
 * 检查命名空间是否可用
 */
export async function checkNamespaceAvailable(name: string): Promise<boolean> {
  try {
    const result = await get<{ available: boolean }>(`/api/namespaces/check/${name}`);
    return result.available;
  } catch {
    return false;
  }
}
