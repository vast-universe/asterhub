/**
 * 发布资源
 * POST /api/registry/publish
 */
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { uploadToR2 } from "@/lib/storage";
import {
  getNamespaceByName,
  getNamespacesByUserId,
  upsertRegistryItem,
  createVersion,
  logPublish,
  getRecentPublishCount,
} from "@/lib/db";
import { PUBLISH_LIMITS, TYPE_MAP } from "@/lib/constants";
import { computeIntegrity } from "@/lib/utils";
import { invalidateNamespaceCache } from "@/lib/redis";
import { checkRateLimit, getClientIP, rateLimitResponse } from "@/lib/redis/ratelimit";

export async function POST(request: Request) {
  // 限流检查
  const user = await verifyToken(request);
  if (!user) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const rateLimit = await checkRateLimit("publish", String(user.id));
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit.reset);
  }

  const body = await request.json();
  const { namespace: namespaceName, index, resources } = body;

  // 验证请求
  if (!namespaceName || !index || !resources) {
    return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
  }

  // 检查命名空间权限
  const userNamespaces = await getNamespacesByUserId(user.id);
  const hasPermission = userNamespaces.some((n) => n.name === namespaceName);
  if (!hasPermission) {
    return NextResponse.json(
      { error: `无权限发布到 @${namespaceName}` },
      { status: 403 }
    );
  }

  const namespace = await getNamespaceByName(namespaceName);
  if (!namespace) {
    return NextResponse.json({ error: "命名空间不存在" }, { status: 404 });
  }

  // 检查发布频率 (数据库层面的限制)
  const recentCount = await getRecentPublishCount(user.id, 1);
  if (recentCount >= PUBLISH_LIMITS.MAX_PER_HOUR) {
    return NextResponse.json(
      { error: `发布过于频繁，每小时最多 ${PUBLISH_LIMITS.MAX_PER_HOUR} 次` },
      { status: 429 }
    );
  }

  // 检查大小
  const totalSize = JSON.stringify(resources).length;
  if (totalSize > PUBLISH_LIMITS.MAX_TOTAL_SIZE) {
    return NextResponse.json(
      { error: `总大小超过 ${PUBLISH_LIMITS.MAX_TOTAL_SIZE / 1024 / 1024}MB 限制` },
      { status: 400 }
    );
  }

  const published: Array<{ name: string; type: string; version: string }> = [];
  const errors: Array<{ name: string; error: string }> = [];

  // 处理每个资源
  for (const resource of resources) {
    try {
      const { name, type: resourceType, style, version, content } = resource;
      const type = TYPE_MAP[resourceType] || resourceType;

      // 计算完整性哈希
      const contentStr = JSON.stringify(content);
      const integrity = computeIntegrity(contentStr);

      // 确定 R2 路径
      let r2Path: string;
      if (type === "ui" && style) {
        r2Path = `@${namespaceName}/components/${style}/${name}/${version}.json`;
      } else if (type === "hook") {
        r2Path = `@${namespaceName}/hooks/${name}/${version}.json`;
      } else if (type === "lib") {
        r2Path = `@${namespaceName}/lib/${name}/${version}.json`;
      } else {
        r2Path = `@${namespaceName}/configs/${name}/${version}.json`;
      }

      // 上传到 R2
      await uploadToR2(r2Path, contentStr);

      // 同时上传 latest.json
      const latestPath = r2Path.replace(`/${version}.json`, "/latest.json");
      await uploadToR2(latestPath, contentStr);

      // 更新数据库
      const item = await upsertRegistryItem({
        namespaceId: namespace.id,
        name,
        type,
        style,
        description: content.description,
        keywords: content.keywords,
        latestVersion: version,
        isOfficial: namespace.name === "asterhub",
      });

      await createVersion({
        itemId: item.id,
        version,
        r2Path,
        fileSize: contentStr.length,
        integrity,
      });

      published.push({ name, type, version });
    } catch (error) {
      errors.push({ name: resource.name, error: (error as Error).message });
    }
  }

  // 更新 index.json
  try {
    const indexPath = `@${namespaceName}/index.json`;
    await uploadToR2(indexPath, JSON.stringify(index));
  } catch (error) {
    console.error("Failed to upload index.json:", error);
  }

  // 清除缓存
  await invalidateNamespaceCache(namespaceName);

  // 记录发布日志
  await logPublish({
    userId: user.id,
    namespaceId: namespace.id,
    itemCount: published.length,
    totalSize,
    ipAddress: getClientIP(request),
  });

  return NextResponse.json({
    success: errors.length === 0,
    published,
    errors: errors.length > 0 ? errors : undefined,
  });
}
