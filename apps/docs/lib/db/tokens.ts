/**
 * Token 数据库操作
 */
import { sql } from "@vercel/postgres";
import { createHash, randomBytes } from "crypto";
import type { Token, TokenScope, User } from "@/types";
import { TOKEN_CONFIG } from "../constants";

/**
 * 计算 Token 哈希
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * 生成随机 Token
 */
function generateToken(): string {
  return `ash_${randomBytes(32).toString("hex")}`;
}

/**
 * 创建 Token（返回原始 token 字符串，只在创建时可见）
 */
export async function createToken(
  userId: number,
  name: string,
  scope: string = "publish"
): Promise<{ token: Token; rawToken: string }> {
  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + TOKEN_CONFIG.EXPIRY_YEARS);
  const scopes = scope === "read" ? ["read"] : ["read", "publish"];
  const scopesArray = `{${scopes.join(",")}}`;

  const { rows } = await sql`
    INSERT INTO tokens (user_id, token_hash, name, scopes, expires_at)
    VALUES (${userId}, ${tokenHash}, ${name}, ${scopesArray}::text[], ${expiresAt.toISOString()})
    RETURNING *
  `;
  return { token: rows[0] as Token, rawToken };
}

/**
 * 根据 Token 获取用户
 */
export async function getUserByToken(token: string): Promise<User | null> {
  const tokenHash = hashToken(token);

  const { rows } = await sql`
    SELECT u.* FROM users u
    JOIN tokens t ON u.id = t.user_id
    WHERE t.token_hash = ${tokenHash}
    AND (t.expires_at IS NULL OR t.expires_at > NOW())
    AND t.revoked = false
  `;

  if (rows[0]) {
    await sql`UPDATE tokens SET last_used_at = NOW() WHERE token_hash = ${tokenHash}`;
  }

  return (rows[0] as User) || null;
}

/**
 * 获取用户的所有 Token
 */
export async function getTokensByUserId(userId: number): Promise<Token[]> {
  const { rows } = await sql`
    SELECT id, name, scopes, created_at, expires_at, last_used_at
    FROM tokens 
    WHERE user_id = ${userId} AND revoked = false
    ORDER BY created_at DESC
  `;
  return rows as Token[];
}

/**
 * 撤销 Token
 */
export async function revokeToken(userId: number, tokenId: number): Promise<boolean> {
  const { rowCount } = await sql`
    UPDATE tokens 
    SET revoked = true, revoked_at = NOW()
    WHERE id = ${tokenId} AND user_id = ${userId}
  `;
  return (rowCount ?? 0) > 0;
}

/**
 * 检查 Token 是否有指定权限
 */
export async function checkTokenScope(token: string, requiredScope: TokenScope): Promise<boolean> {
  const tokenHash = hashToken(token);

  const { rows } = await sql`
    SELECT scopes FROM tokens
    WHERE token_hash = ${tokenHash}
    AND (expires_at IS NULL OR expires_at > NOW())
    AND revoked = false
  `;

  if (!rows[0]) return false;
  const scopes = rows[0].scopes as TokenScope[];
  return scopes.includes(requiredScope);
}
