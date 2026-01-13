/**
 * 撤销 Token
 * DELETE /api/auth/tokens/:id
 */
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { revokeToken } from "@/lib/db";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyToken(request);
  if (!user) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id } = await params;
  const tokenId = parseInt(id);

  if (isNaN(tokenId)) {
    return NextResponse.json({ error: "无效的 Token ID" }, { status: 400 });
  }

  const success = await revokeToken(user.id, tokenId);

  if (!success) {
    return NextResponse.json({ error: "Token 不存在或已撤销" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
