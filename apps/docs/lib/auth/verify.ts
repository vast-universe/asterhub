/**
 * 认证验证工具
 */
import { getUserByToken } from "../db";
import type { User } from "@/types";

/**
 * 从请求中验证 Token
 */
export async function verifyToken(request: Request): Promise<User | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);
  return getUserByToken(token);
}

/**
 * 需要认证的中间件
 */
export async function requireAuth(request: Request): Promise<{ user: User } | Response> {
  const user = await verifyToken(request);
  if (!user) {
    return new Response(JSON.stringify({ error: "未授权", code: "UNAUTHORIZED" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return { user };
}
