/**
 * Registry 数据库操作
 */
import { sql } from "@vercel/postgres";
import type {
  CreateVersionData,
  RegistryItem,
  RegistryVersion,
  SearchOptions,
  SearchResponse,
  UpsertRegistryItemData,
} from "@/types";

interface GetRegistryItemOptions {
  name: string;
  framework?: string;
  style?: string;
  type?: string;
  namespace?: string;
}

interface SearchRegistryOptions {
  framework?: string;
  style?: string;
  type?: string;
  namespace?: string;
}

/**
 * 获取 Registry Item (新版 - 按参数对象)
 */
export async function getRegistryItem(
  options: GetRegistryItemOptions
): Promise<RegistryItem | null> {
  const { name, framework, style, type, namespace } = options;

  const { rows } = await sql`
    SELECT ri.*, n.name as namespace_name
    FROM registry_items ri
    JOIN namespaces n ON ri.namespace_id = n.id
    WHERE ri.name = ${name}
    AND (${framework || null}::text IS NULL OR ri.framework = ${framework})
    AND (${style || null}::text IS NULL OR ri.style = ${style})
    AND (${type || null}::text IS NULL OR ri.type = ${type})
    AND (${namespace || null}::text IS NULL OR n.name = ${namespace})
    AND ri.deprecated = false
    LIMIT 1
  `;
  return (rows[0] as RegistryItem) || null;
}

/**
 * 获取 Registry Item (旧版 - 按位置参数，保持兼容)
 */
export async function getRegistryItemByNamespace(
  namespaceId: number,
  name: string,
  type: string,
  style?: string
): Promise<RegistryItem | null> {
  // 对于非 UI 类型，使用空字符串匹配
  const styleValue = type === "ui" ? style || "nativewind" : "";

  const { rows } = await sql`
    SELECT * FROM registry_items 
    WHERE namespace_id = ${namespaceId} 
    AND name = ${name} 
    AND type = ${type}
    AND style = ${styleValue}
  `;
  return (rows[0] as RegistryItem) || null;
}

/**
 * 搜索 Registry Items (简化版)
 */
export async function searchRegistry(
  options: SearchRegistryOptions
): Promise<RegistryItem[]> {
  const { framework, style, type, namespace } = options;

  const { rows } = await sql`
    SELECT ri.*, n.name as namespace_name
    FROM registry_items ri
    JOIN namespaces n ON ri.namespace_id = n.id
    WHERE 
      (${framework || null}::text IS NULL OR ri.framework = ${framework})
      AND (${style || null}::text IS NULL OR ri.style = ${style})
      AND (${type || null}::text IS NULL OR ri.type = ${type})
      AND (${namespace || null}::text IS NULL OR n.name = ${namespace})
      AND ri.deprecated = false
    ORDER BY ri.is_official DESC, ri.total_downloads DESC
    LIMIT 100
  `;
  return rows as RegistryItem[];
}

/**
 * 创建或更新 Registry Item
 */
export async function upsertRegistryItem(data: UpsertRegistryItemData): Promise<RegistryItem> {
  const styleValue = data.type === "ui" ? data.style || "nativewind" : "";
  const keywordsStr = (data.keywords || []).join(",");

  const { rows } = await sql`
    INSERT INTO registry_items (
      namespace_id, name, type, style, description, keywords, latest_version, is_official
    ) VALUES (
      ${data.namespaceId}, ${data.name}, ${data.type}, ${styleValue}, 
      ${data.description || null}, string_to_array(${keywordsStr}, ','), ${data.latestVersion}, ${data.isOfficial || false}
    )
    ON CONFLICT (namespace_id, name, type, style) 
    DO UPDATE SET 
      description = EXCLUDED.description,
      keywords = EXCLUDED.keywords,
      latest_version = EXCLUDED.latest_version,
      updated_at = NOW()
    RETURNING *
  `;
  return rows[0] as RegistryItem;
}

/**
 * 创建版本
 */
export async function createVersion(data: CreateVersionData): Promise<RegistryVersion> {
  const { rows } = await sql`
    INSERT INTO registry_versions (item_id, version, r2_path, file_size, integrity)
    VALUES (${data.itemId}, ${data.version}, ${data.r2Path}, ${data.fileSize || null}, ${data.integrity || null})
    RETURNING *
  `;
  return rows[0] as RegistryVersion;
}

/**
 * 获取版本列表
 */
export async function getVersions(itemId: number): Promise<RegistryVersion[]> {
  const { rows } = await sql`
    SELECT * FROM registry_versions 
    WHERE item_id = ${itemId} 
    ORDER BY published_at DESC
  `;
  return rows as RegistryVersion[];
}

/**
 * 增加下载计数
 */
export async function incrementDownload(itemId: number, version: string): Promise<void> {
  await sql`
    INSERT INTO downloads (item_id, version, count)
    VALUES (${itemId}, ${version}, 1)
    ON CONFLICT (item_id, version, date)
    DO UPDATE SET count = downloads.count + 1
  `;

  await sql`
    UPDATE registry_versions 
    SET downloads = downloads + 1 
    WHERE item_id = ${itemId} AND version = ${version}
  `;

  await sql`
    UPDATE registry_items 
    SET total_downloads = total_downloads + 1 
    WHERE id = ${itemId}
  `;
}

/**
 * 搜索 Registry Items
 */
export async function searchRegistryItems(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResponse> {
  const { type, style, namespace, limit = 20, offset = 0 } = options;

  // style 只对 UI 组件有效，其他类型忽略 style 过滤
  const { rows } = await sql`
    SELECT 
      ri.*, n.name as namespace_name,
      ts_rank(
        to_tsvector('simple', ri.name || ' ' || COALESCE(ri.description, '')),
        plainto_tsquery('simple', ${query || ""})
      ) as relevance
    FROM registry_items ri
    JOIN namespaces n ON ri.namespace_id = n.id
    WHERE 
      (${query || ""}::text = '' OR to_tsvector('simple', ri.name || ' ' || COALESCE(ri.description, '')) @@ plainto_tsquery('simple', ${query}))
      AND (${type || null}::text IS NULL OR ri.type = ${type})
      AND (${style || null}::text IS NULL OR ri.type != 'ui' OR ri.style = ${style})
      AND (${namespace || null}::text IS NULL OR n.name = ${namespace})
      AND ri.deprecated = false
    ORDER BY ri.is_official DESC, relevance DESC, ri.total_downloads DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  const { rows: countRows } = await sql`
    SELECT COUNT(*) as total
    FROM registry_items ri
    JOIN namespaces n ON ri.namespace_id = n.id
    WHERE 
      (${query || ""}::text = '' OR to_tsvector('simple', ri.name || ' ' || COALESCE(ri.description, '')) @@ plainto_tsquery('simple', ${query}))
      AND (${type || null}::text IS NULL OR ri.type = ${type})
      AND (${style || null}::text IS NULL OR ri.type != 'ui' OR ri.style = ${style})
      AND (${namespace || null}::text IS NULL OR n.name = ${namespace})
      AND ri.deprecated = false
  `;

  return {
    items: rows.map((row: Record<string, unknown>) => ({
      namespace: row.namespace_name as string,
      name: row.name as string,
      type: row.type as string,
      style: row.style as string | undefined,
      description: row.description as string | undefined,
      latestVersion: row.latest_version as string | undefined,
      downloads: row.total_downloads as number,
      isOfficial: row.is_official as boolean,
    })),
    total: parseInt(countRows[0].total as string),
  };
}

/**
 * 获取命名空间下的所有资源
 */
export async function getRegistryItemsByNamespace(namespaceId: number): Promise<RegistryItem[]> {
  const { rows } = await sql`
    SELECT * FROM registry_items 
    WHERE namespace_id = ${namespaceId}
    AND deprecated = false
    ORDER BY type, name
  `;
  return rows as RegistryItem[];
}
