/**
 * 删除命名空间
 * DELETE /api/auth/namespaces/:name
 */
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { deleteNamespace, getNamespaceByName } from "@/lib/db";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const user = await verifyToken(request);
  if (!user) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { name } = await params;

  // 检查命名空间是否存在且属于当前用户
  const namespace = await getNamespaceByName(name);
  if (!namespace) {
    return NextResponse.json({ error: "命名空间不存在" }, { status: 404 });
  }

  if (namespace.user_id !== user.id) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  if (namespace.is_default) {
    return NextResponse.json({ error: "不能删除默认命名空间" }, { status: 400 });
  }

  const success = await deleteNamespace(user.id, name);

  if (!success) {
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/**
 * 检查命名空间是否可用
 * GET /api/auth/namespaces/:name
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;

  const namespace = await getNamespaceByName(name);

  return NextResponse.json({
    name,
    available: !namespace,
  });
}
