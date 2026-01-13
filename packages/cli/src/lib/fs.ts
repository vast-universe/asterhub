/**
 * 文件系统工具 - 统一的文件操作
 */
import path from "path";
import fs from "fs-extra";

/**
 * 读取 JSON 文件
 */
export async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    if (!(await fs.pathExists(filePath))) {
      return null;
    }
    return await fs.readJson(filePath);
  } catch {
    return null;
  }
}

/**
 * 写入 JSON 文件
 */
export async function writeJson(filePath: string, data: any): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeJson(filePath, data, { spaces: 2 });
}

/**
 * 读取文本文件
 */
export async function readText(filePath: string): Promise<string | null> {
  try {
    if (!(await fs.pathExists(filePath))) {
      return null;
    }
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}

/**
 * 写入文本文件
 */
export async function writeText(filePath: string, content: string): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, "utf-8");
}

/**
 * 检查文件是否存在
 */
export async function exists(filePath: string): Promise<boolean> {
  return fs.pathExists(filePath);
}

/**
 * 删除文件或目录
 */
export async function remove(filePath: string): Promise<void> {
  await fs.remove(filePath);
}

/**
 * 复制文件或目录
 */
export async function copy(src: string, dest: string): Promise<void> {
  await fs.copy(src, dest);
}

/**
 * 确保目录存在
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await fs.ensureDir(dirPath);
}

/**
 * 列出目录内容
 */
export async function listDir(dirPath: string): Promise<string[]> {
  try {
    if (!(await fs.pathExists(dirPath))) {
      return [];
    }
    return await fs.readdir(dirPath);
  } catch {
    return [];
  }
}

/**
 * 获取文件信息
 */
export async function stat(filePath: string): Promise<fs.Stats | null> {
  try {
    return await fs.stat(filePath);
  } catch {
    return null;
  }
}

/**
 * 解析相对路径
 */
export function resolve(...paths: string[]): string {
  return path.resolve(...paths);
}

/**
 * 获取文件名
 */
export function basename(filePath: string, ext?: string): string {
  return path.basename(filePath, ext);
}

/**
 * 获取目录名
 */
export function dirname(filePath: string): string {
  return path.dirname(filePath);
}

/**
 * 拼接路径
 */
export function join(...paths: string[]): string {
  return path.join(...paths);
}
