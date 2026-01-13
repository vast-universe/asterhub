/**
 * 获取所有资源列表
 * GET /api/registry?type=ui&style=nativewind&limit=100
 */
import { NextResponse } from "next/server";
import { searchRegistryItems } from "@/lib/db";
import { checkRateLimit, getClientIP, rateLimitResponse } from "@/lib/redis/ratelimit";

export async function GET(request: Request) {
  // 限流检查
  const clientIP = getClientIP(request);
  const rateLimit = await checkRateLimit("download", clientIP);
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit.reset);
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || undefined;
  const style = searchParams.get("style") || undefined;
  const framework = searchParams.get("framework") || undefined;
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  // 使用空查询获取所有资源
  const result = await searchRegistryItems("", {
    type,
    style,
    namespace: undefined,
    limit: Math.min(limit, 100),
    offset,
  });

  return NextResponse.json(result);
}
