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
  data: { github_username?: string; email?: string | null; avatar_url?: string | null }
): Promise<User | null> {
  const user = await sql`SELECT * FROM users WHERE id = ${userId}`;
  if (!user.rows[0]) return null;

  const current = user.rows[0] as User;
  const { rows } = await sql`
    UPDATE users 
    SET 
      github_username = ${data.github_username !== undefined ? data.github_username : current.github_username},
      email = ${data.email !== undefined ? data.email : current.email},
      avatar_url = ${data.avatar_url !== undefined ? data.avatar_url : current.avatar_url}
    WHERE id = ${userId}
    RETURNING *
  `;
  return (rows[0] as User) || null;
}
