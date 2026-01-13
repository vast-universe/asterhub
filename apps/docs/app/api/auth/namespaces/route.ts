/**
 * 命名空间管理
 * GET /api/auth/namespaces - 列出命名空间
 * POST /api/auth/namespaces - 创建命名空间
 */
import { NextResponse } from "next/server";
import { verifyToken, validateNamespaceName } from "@/lib/auth";
import {
  getNamespacesByUserId,
  getNamespaceByName,
  createNamespace,
  countUserNamespaces,
} from "@/lib/db";

const MAX_NAMESPACES = 5;

export async function GET(request: Request) {
  const user = await verifyToken(request);
  if (!user) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const namespaces = await getNamespacesByUserId(user.id);

  return NextResponse.json({
    namespaces: namespaces.map((n) => ({
      name: n.name,
      description: n.description,
      isDefault: n.is_default,
      verified: n.verified,
      createdAt: n.created_at,
    })),
  });
}

export async function POST(request: Request) {
  const user = await verifyToken(request);
  if (!user) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const body = await request.json();
  const { name } = body;

  // 验证名称
  const validation = validateNamespaceName(name);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // 检查数量限制
  const count = await countUserNamespaces(user.id);
  if (count >= MAX_NAMESPACES) {
    return NextResponse.json(
      { error: `最多只能创建 ${MAX_NAMESPACES} 个命名空间` },
      { status: 400 }
    );
  }

  // 检查是否已存在
  const existing = await getNamespaceByName(name);
  if (existing) {
    return NextResponse.json({ error: "命名空间已存在" }, { status: 409 });
  }

  // 创建
  const namespace = await createNamespace(user.id, name);

  return NextResponse.json({
    name: namespace.name,
    isDefault: namespace.is_default,
    createdAt: namespace.created_at,
  });
}
