/**
 * 认证工具 - Token 和凭证管理
 */
import os from "os";
import { CREDENTIALS_DIR, CREDENTIALS_FILE } from "../constants";
import { readJson, writeJson, join, ensureDir } from "./fs";
import type { Credentials, UserInfo } from "../types";

/**
 * 获取凭证文件路径
 */
function getCredentialsPath(): string {
  return join(os.homedir(), CREDENTIALS_DIR, CREDENTIALS_FILE);
}

/**
 * 读取凭证
 */
export async function readCredentials(): Promise<Credentials | null> {
  return readJson<Credentials>(getCredentialsPath());
}

/**
 * 写入凭证
 */
export async function writeCredentials(credentials: Credentials): Promise<void> {
  const dir = join(os.homedir(), CREDENTIALS_DIR);
  await ensureDir(dir);
  await writeJson(getCredentialsPath(), credentials);
}

/**
 * 清除凭证
 */
export async function clearCredentials(): Promise<void> {
  const { remove } = await import("./fs");
  await remove(getCredentialsPath());
}

/**
 * 获取 Token
 */
export async function getToken(): Promise<string | null> {
  const credentials = await readCredentials();
  if (!credentials?.token) {
    return null;
  }

  // 检查是否过期
  if (credentials.expiresAt) {
    const expiresAt = new Date(credentials.expiresAt);
    if (expiresAt < new Date()) {
      return null;
    }
  }

  return credentials.token;
}

/**
 * 获取用户信息
 */
export async function getUserInfo(): Promise<UserInfo | null> {
  const credentials = await readCredentials();
  return credentials?.user || null;
}

/**
 * 检查是否已登录
 */
export async function isLoggedIn(): Promise<boolean> {
  const token = await getToken();
  return token !== null;
}
