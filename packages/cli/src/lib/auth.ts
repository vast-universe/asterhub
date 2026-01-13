/**
 * 认证工具
 */
import os from "os";
import { CREDENTIALS_DIR, CREDENTIALS_FILE } from "../constants";
import type { Credentials, UserInfo } from "../types";
import { ensureDir, exists, join, readJson, remove, writeJson } from "./fs";

/**
 * 获取凭证文件路径
 */
function getCredentialsPath(): string {
  return join(os.homedir(), CREDENTIALS_DIR, CREDENTIALS_FILE);
}

/**
 * 读取凭证
 */
export async function getCredentials(): Promise<Credentials | null> {
  return readJson<Credentials>(getCredentialsPath());
}

/**
 * 保存凭证
 */
export async function saveCredentials(credentials: Credentials): Promise<void> {
  const credPath = getCredentialsPath();
  await ensureDir(join(os.homedir(), CREDENTIALS_DIR));
  await writeJson(credPath, credentials);
}

/**
 * 删除凭证
 */
export async function removeCredentials(): Promise<void> {
  const path = getCredentialsPath();
  if (await exists(path)) {
    await remove(path);
  }
}

/**
 * 检查是否已登录
 */
export async function isAuthenticated(): Promise<boolean> {
  const credentials = await getCredentials();
  return !!credentials?.token;
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUserInfo(): Promise<UserInfo | null> {
  const credentials = await getCredentials();
  return credentials?.user || null;
}
