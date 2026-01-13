/**
 * 认证服务
 */
import { del, get, post } from "../lib/http";
import type { UserInfo } from "../types";

// Token 信息
interface Token {
  id: string;
  name: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt?: string;
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(): Promise<UserInfo> {
  return get<UserInfo>("/api/user");
}

/**
 * 获取 Token 列表
 */
export async function getTokens(): Promise<Token[]> {
  return get<Token[]>("/api/tokens");
}

/**
 * 创建 Token
 */
export async function createToken(name: string, scopes: string[]): Promise<{ token: string; id: string }> {
  return post<{ token: string; id: string }>("/api/tokens", { name, scopes });
}

/**
 * 撤销 Token
 */
export async function revokeToken(id: string): Promise<void> {
  await del(`/api/tokens/${id}`);
}
