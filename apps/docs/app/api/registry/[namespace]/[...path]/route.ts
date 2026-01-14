/**
 * 获取资源内容或版本列表
 * GET /api/registry/@:namespace/:type:name/:version
 * GET /api/registry/@:namespace/:type:name/versions (获取版本列表)
 */
import { NextResponse } from "next/server";
import { getFromR2 } from "@/lib/storage";
import {
  incrementDownload,
  getRegistryItemByNamespace,
  getNamespaceByName,
  getVersions,
} from "@/lib/db";
import { getCachedResource, cacheResource } from "@/lib/redis";
import { checkRateLimit, getClientIP, rateLimitResponse } from "@/lib/redis/ratelimit";
import { promises as fs } from "fs";
import path from "path";

// 本地开发时从 dist 目录读取
async function getFromLocal(
  type: string,
  name: string,
  style: string,
  version: string
): Promise<string | null> {
  try {
    // 本地 dist 目录路径
    const distDir = path.resolve(process.cwd(), "../../packages/registry/dist");
    let filePath: string;

    if (type === "ui") {
      filePath = path.join(distDir, "components", style, name, `${version}.json`);
    } else if (type === "hook") {
      filePath = path.join(distDir, "hooks", name, `${version}.json`);
    } else if (type === "lib") {
      filePath = path.join(distDir, "lib", name, `${version}.json`);
    } else {
      filePath = path.join(distDir, "configs", name, `${version}.json`);
    }

    return await fs.readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ namespace: string; path: string[] }> }
) {
  try {
    // 限流检查
    const clientIP = getClientIP(request);
    const rateLimit = await checkRateLimit("download", clientIP);
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.reset);
    }

    const resolvedParams = await context.params;
    const rawNamespace = resolvedParams.namespace || "";
    const path = resolvedParams.path || [];

    // 移除 @ 前缀（如果有）
    const namespace = rawNamespace.startsWith("@")
      ? rawNamespace.slice(1)
      : rawNamespace;

    const { searchParams } = new URL(request.url);
    const style = searchParams.get("style") || "tailwind";

    if (!path || path.length < 1) {
      return NextResponse.json({ error: "缺少资源名称" }, { status: 400 });
    }

    // 解析路径: [type:name, version] 或 [name, version]
    const [nameWithType, versionOrAction = "latest"] = path;

    let type = "ui";
    let name = nameWithType;

    if (nameWithType.includes(":")) {
      const [t, n] = nameWithType.split(":");
      type =
        t === "hook"
          ? "hook"
          : t === "lib"
            ? "lib"
            : t === "config"
              ? "config"
              : "ui";
      name = n;
    }

    // 如果是获取版本列表
    if (versionOrAction === "versions") {
      const ns = await getNamespaceByName(namespace);
      if (!ns) {
        return NextResponse.json({ error: "命名空间不存在" }, { status: 404 });
      }

      const item = await getRegistryItemByNamespace(
        ns.id,
        name,
        type,
        type === "ui" ? style : undefined
      );
      if (!item) {
        return NextResponse.json({ error: "资源不存在" }, { status: 404 });
      }

      const versions = await getVersions(item.id);
      return NextResponse.json({
        namespace,
        name,
        type,
        versions: versions.map((v) => ({
          version: v.version,
          publishedAt: v.published_at,
          downloads: v.downloads,
          deprecated: v.deprecated,
        })),
      });
    }

    // 获取资源内容
    const version = versionOrAction;
    const cacheType = type === "ui" ? `${type}:${style}` : type;

    // 先查缓存
    const cached = await getCachedResource<string>(
      namespace,
      cacheType,
      name,
      version
    );
    if (cached) {
      recordDownload(namespace, name, type, style, version);
      return NextResponse.json(
        typeof cached === "string" ? JSON.parse(cached) : cached
      );
    }

    // 构建 R2 路径
    let r2Path: string;
    if (type === "ui") {
      r2Path = `@${namespace}/components/${style}/${name}/${version}.json`;
    } else if (type === "hook") {
      r2Path = `@${namespace}/hooks/${name}/${version}.json`;
    } else if (type === "lib") {
      r2Path = `@${namespace}/lib/${name}/${version}.json`;
    } else {
      r2Path = `@${namespace}/configs/${name}/${version}.json`;
    }

    // 从 R2 获取
    let content = await getFromR2(r2Path);

    // 本地开发回退：从 dist 目录读取
    if (!content && namespace === "asterhub") {
      content = await getFromLocal(type, name, style, version);
    }

    if (!content) {
      return NextResponse.json(
        { error: "资源不存在", path: r2Path },
        { status: 404 }
      );
    }

    // 存入缓存
    await cacheResource(namespace, cacheType, name, version, content);

    // 记录下载
    recordDownload(namespace, name, type, style, version);

    return NextResponse.json(JSON.parse(content));
  } catch (error) {
    console.error("[GET resource] Error:", error);
    return NextResponse.json(
      { error: "服务器错误", details: (error as Error).message },
      { status: 500 }
    );
  }
}

// 异步记录下载
async function recordDownload(
  namespace: string,
  name: string,
  type: string,
  style: string,
  version: string
) {
  try {
    const ns = await getNamespaceByName(namespace);
    if (ns) {
      const item = await getRegistryItemByNamespace(
        ns.id,
        name,
        type,
        type === "ui" ? style : undefined
      );
      if (item) {
        await incrementDownload(item.id, version);
      }
    }
  } catch {
    // 忽略统计错误
  }
}
