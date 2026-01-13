/**
 * 获取命名空间下的资源列表
 * GET /api/registry/@:namespace
 */
import { NextResponse } from "next/server";
import { getFromR2 } from "@/lib/storage";
import { getCachedIndex, cacheIndex } from "@/lib/redis";
import { checkRateLimit, getClientIP, rateLimitResponse } from "@/lib/redis/ratelimit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ namespace: string }> }
) {
  // 限流检查
  const clientIP = getClientIP(request);
  const rateLimit = await checkRateLimit("download", clientIP);
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit.reset);
  }

  const { namespace } = await params;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  // 先查缓存
  const cached = await getCachedIndex<string>(namespace);
  if (cached) {
    const index = typeof cached === "string" ? JSON.parse(cached) : cached;
    return formatResponse(namespace, index, type);
  }

  // 从 R2 获取 index.json
  const indexPath = `@${namespace}/index.json`;
  const indexContent = await getFromR2(indexPath);

  if (!indexContent) {
    return NextResponse.json({ error: "命名空间不存在" }, { status: 404 });
  }

  // 存入缓存
  await cacheIndex(namespace, indexContent);

  const index = JSON.parse(indexContent);
  return formatResponse(namespace, index, type);
}

function formatResponse(namespace: string, index: Record<string, unknown>, type: string | null) {
  // 如果指定了类型，只返回该类型
  if (type) {
    const typeMap: Record<string, string> = {
      ui: "components",
      hook: "hooks",
      lib: "lib",
      config: "configs",
    };
    const key = typeMap[type] || type;
    return NextResponse.json({
      namespace,
      resources: index[key] || [],
    });
  }

  return NextResponse.json({
    namespace,
    version: index.version,
    components: index.components || [],
    hooks: index.hooks || [],
    lib: index.lib || [],
    configs: index.configs || [],
  });
}
