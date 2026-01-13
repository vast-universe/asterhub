/**
 * 安全公告数据库操作
 */
import { sql } from "@vercel/postgres";
import type { SecurityAdvisory } from "@/types";

/**
 * 获取安全公告
 */
export async function getSecurityAdvisories(itemIds?: number[]): Promise<SecurityAdvisory[]> {
  if (itemIds && itemIds.length > 0) {
    const itemIdsArray = `{${itemIds.join(",")}}`;
    const { rows } = await sql`
      SELECT * FROM security_advisories 
      WHERE published_at IS NOT NULL
      AND affected_items && ${itemIdsArray}::int[]
      ORDER BY published_at DESC
    `;
    return rows as SecurityAdvisory[];
  }

  const { rows } = await sql`
    SELECT * FROM security_advisories 
    WHERE published_at IS NOT NULL
    ORDER BY published_at DESC
    LIMIT 50
  `;
  return rows as SecurityAdvisory[];
}

/**
 * 检查资源是否有安全问题
 */
export async function checkSecurityIssues(
  itemIds: number[]
): Promise<{ hasIssues: boolean; advisories: SecurityAdvisory[] }> {
  const advisories = await getSecurityAdvisories(itemIds);
  return {
    hasIssues: advisories.length > 0,
    advisories,
  };
}
