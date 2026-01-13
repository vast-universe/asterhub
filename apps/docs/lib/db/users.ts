/**
 * 用户数据库操作
 */
import { sql } from "@vercel/postgres";
import type { CreateUserData, User } from "@/types";

/**
 * 根据 GitHub ID 获取用户
 */
export async function getUserByGithubId(githubId: string): Promise<User | null> {
  const { rows } = await sql`
    SELECT * FROM users WHERE github_id = ${githubId}
  `;
  return (rows[0] as User) || null;
}

/**
 * 创建用户
 */
export async function createUser(data: CreateUserData): Promise<User> {
  const { rows } = await sql`
    INSERT INTO users (github_id, github_username, email, avatar_url)
    VALUES (${data.githubId}, ${data.githubUsername}, ${data.email || null}, ${data.avatarUrl || null})
    RETURNING *
  `;
  return rows[0] as User;
}

/**
 * 更新用户信息
 */
export async function updateUser(
  userId: number,
  data: Partial<Pick<User, "github_username" | "email" | "avatar_url">>
): Promise<User | null> {
  const { rows } = await sql`
    UPDATE users 
    SET 
      github_username = COALESCE(${data.github_username || null}, github_username),
      email = COALESCE(${data.email || null}, email),
      avatar_url = COALESCE(${data.avatar_url || null}, avatar_url)
    WHERE id = ${userId}
    RETURNING *
  `;
  return (rows[0] as User) || null;
}
