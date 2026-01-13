/**
 * Token 管理
 * GET /api/auth/tokens - 列出 Token
 * POST /api/auth/tokens - 创建 Token
 */
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { verifyToken } from "@/lib/auth";
import { getTokensByUserId, createToken } from "@/lib/db";

export async function GET(request: Request) {
  const user = await verifyToken(request);
  if (!user) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const tokens = await getTokensByUserId(user.id);

  return NextResponse.json({
    tokens: tokens.map((t) => ({
      id: t.id,
      name: t.name,
      scopes: t.scopes,
      createdAt: t.created_at,
      lastUsedAt: t.last_used_at,
      expiresAt: t.expires_at,
    })),
  });
}

export async function POST(request: Request) {
  const user = await verifyToken(request);
  if (!user) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const body = await request.json();
  const { name, scopes = ["read", "publish"] } = body;

  // 生成新 Token
  const token = `asterhub_${nanoid(32)}`;
  const created = await createToken(user.id, token, name, scopes);

  return NextResponse.json({
    token, // 只在创建时返回原始 token
    id: created.id,
    name: created.name,
    scopes: created.scopes,
    expiresAt: created.expires_at,
  });
}
