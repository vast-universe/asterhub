/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getNamespacesByUserId } from "@/lib/db";

export async function GET(request: Request) {
  const user = await verifyToken(request);

  if (!user) {
    return NextResponse.json({ error: "未授权", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const namespaces = await getNamespacesByUserId(user.id);

  return NextResponse.json({
    id: user.id,
    username: user.github_username,
    email: user.email,
    avatarUrl: user.avatar_url,
    namespaces: namespaces.map((n) => n.name),
  });
}
