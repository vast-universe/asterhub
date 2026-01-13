/**
 * 命名空间数据库操作
 */
import { sql } from "@vercel/postgres";
import type { Namespace } from "@/types";
import { NAMESPACE_LIMITS } from "../constants";

/**
 * 获取用户的所有命名空间
 */
export async function getNamespacesByUserId(userId: number): Promise<Namespace[]> {
  const { rows } = await sql`
    SELECT * FROM namespaces WHERE user_id = ${userId}
  `;
  return rows as Namespace[];
}

/**
 * 根据名称获取命名空间
 */
export async function getNamespaceByName(name: string): Promise<Namespace | null> {
  const { rows } = await sql`
    SELECT * FROM namespaces WHERE name = ${name}
  `;
  return (rows[0] as Namespace) || null;
}

/**
 * 创建命名空间
 */
export async function createNamespace(
  userId: number,
  name: string,
  isDefault = false
): Promise<Namespace> {
  const { rows } = await sql`
    INSERT INTO namespaces (user_id, name, is_default)
    VALUES (${userId}, ${name}, ${isDefault})
    RETURNING *
  `;
  return rows[0] as Namespace;
}

/**
 * 删除命名空间
 */
export async function deleteNamespace(userId: number, name: string): Promise<boolean> {
  const { rowCount } = await sql`
    DELETE FROM namespaces 
    WHERE user_id = ${userId} AND name = ${name} AND is_default = false
  `;
  return (rowCount ?? 0) > 0;
}

/**
 * 统计用户命名空间数量
 */
export async function countUserNamespaces(userId: number): Promise<number> {
  const { rows } = await sql`
    SELECT COUNT(*) as count FROM namespaces WHERE user_id = ${userId}
  `;
  return parseInt(rows[0].count);
}

/**
 * 检查用户是否可以创建新命名空间
 */
export async function canCreateNamespace(userId: number): Promise<boolean> {
  const count = await countUserNamespaces(userId);
  return count < NAMESPACE_LIMITS.MAX_PER_USER;
}

/**
 * 更新命名空间描述
 */
export async function updateNamespaceDescription(
  userId: number,
  name: string,
  description: string
): Promise<boolean> {
  const { rowCount } = await sql`
    UPDATE namespaces 
    SET description = ${description}
    WHERE user_id = ${userId} AND name = ${name}
  `;
  return (rowCount ?? 0) > 0;
}
