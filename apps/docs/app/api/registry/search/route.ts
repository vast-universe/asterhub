/**
 * 搜索资源
 * GET /api/registry/search?q=button&type=ui&namespace=xxx
 */
import { NextResponse } from "next/server";
import { searchRegistryItems } from "@/lib/db";
import { checkRateLimit, getClientIP, rateLimitResponse } from "@/lib/redis/ratelimit";

export async function GET(request: Request) {
  // 限流检查
  const clientIP = getClientIP(request);
  const rateLimit = await checkRateLimit("search", clientIP);
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit.reset);
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const type = searchParams.get("type") || undefined;
  const style = searchParams.get("style") || undefined;
  const namespace = searchParams.get("namespace") || undefined;
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");

  const result = await searchRegistryItems(q, {
    type,
    style,
    namespace,
    limit: Math.min(limit, 100),
    offset,
  });

  return NextResponse.json(result);
}
