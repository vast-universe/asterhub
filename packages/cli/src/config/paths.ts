/**
 * 路径和文件名配置
 */
import os from "os";
import path from "path";

// 配置文件名
export const CONFIG_FILE = "asterhub.json";

// 凭证文件名
export const CREDENTIALS_FILE = "credentials.json";

// 事务文件名
export const TRANSACTION_FILE = ".transaction.json";

// AsterHub 目录名
export const ASTERHUB_DIR = ".asterhub";

/**
 * 获取用户主目录下的 AsterHub 目录
 */
export function getHomeDir(): string {
  return path.join(os.homedir(), ASTERHUB_DIR);
}

/**
 * 获取凭证文件路径
 */
export function getCredentialsPath(): string {
  return path.join(getHomeDir(), CREDENTIALS_FILE);
}

/**
 * 获取项目配置文件路径
 */
export function getConfigPath(cwd: string = process.cwd()): string {
  return path.join(cwd, CONFIG_FILE);
}

/**
 * 获取事务文件路径
 */
export function getTransactionPath(cwd: string = process.cwd()): string {
  return path.join(cwd, ASTERHUB_DIR, TRANSACTION_FILE);
}
