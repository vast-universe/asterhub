/**
 * 发布日志数据库操作
 */
import { sql } from "@vercel/postgres";
import type { PublishLogData } from "@/types";

/**
 * 记录发布日志
 */
export async function logPublish(data: PublishLogData): Promise<void> {
  await sql`
    INSERT INTO publish_logs (user_id, namespace_id, item_count, total_size, ip_address)
    VALUES (${data.userId}, ${data.namespaceId}, ${data.itemCount}, ${data.totalSize}, ${data.ipAddress || null})
  `;
}

/**
 * 获取最近发布次数
 */
export async function getRecentPublishCount(userId: number, hours = 1): Promise<number> {
  const { rows } = await sql`
    SELECT COUNT(*) as count
    FROM publish_logs 
    WHERE user_id = ${userId} 
    AND created_at >= NOW() - INTERVAL '1 hour' * ${hours}
  `;
  return parseInt(rows[0].count as string);
}

/**
 * 获取今日发布次数
 */
export async function getTodayPublishCount(userId: number): Promise<number> {
  const { rows } = await sql`
    SELECT COUNT(*) as count
    FROM publish_logs 
    WHERE user_id = ${userId} 
    AND created_at >= CURRENT_DATE
  `;
  return parseInt(rows[0].count as string);
}
