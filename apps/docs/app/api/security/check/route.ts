/**
 * 安全检查
 * POST /api/security/check
 */
import { NextResponse } from "next/server";
import { getSecurityAdvisories, getNamespaceByName, getRegistryItemByNamespace } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json();
  const { resources } = body;

  if (!resources || !Array.isArray(resources)) {
    return NextResponse.json({ error: "缺少 resources 参数" }, { status: 400 });
  }

  // 收集所有资源的 item IDs
  const itemIds: number[] = [];

  for (const ref of resources) {
    const { namespace, type, name } = ref;
    const ns = await getNamespaceByName(namespace);
    if (ns) {
      const item = await getRegistryItemByNamespace(ns.id, name, type);
      if (item) {
        itemIds.push(item.id);
      }
    }
  }

  // 查询安全公告
  const advisories = await getSecurityAdvisories(itemIds);

  return NextResponse.json({
    advisories: advisories.map((a) => ({
      id: a.id,
      severity: a.severity,
      title: a.title,
      description: a.description,
      affectedVersions: a.affected_versions,
      patchedVersion: a.patched_version,
      publishedAt: a.published_at,
    })),
  });
}
