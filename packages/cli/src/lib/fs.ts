/**
 * 文件系统工具 - 统一的文件操作
 */
import path from "path";
import fsExtra from "fs-extra";

export const { join, dirname, basename, extname, resolve, relative } = path;

/**
 * 读取 JSON 文件
 */
export async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    if (!(await fsExtra.pathExists(filePath))) {
      return null;
    }
    return await fsExtra.readJson(filePath);
  } catch {
    return null;
  }
}

/**
 * 写入 JSON 文件
 */
export async function writeJson(filePath: string, data: unknown): Promise<void> {
  await fsExtra.ensureDir(path.dirname(filePath));
  await fsExtra.writeJson(filePath, data, { spaces: 2 });
}

/**
 * 读取文本文件
 */
export async function readText(filePath: string): Promise<string | null> {
  try {
    if (!(await fsExtra.pathExists(filePath))) {
      return null;
    }
    return await fsExtra.readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}

/**
 * 写入文本文件
 */
export async function writeText(filePath: string, content: string): Promise<void> {
  await fsExtra.ensureDir(path.dirname(filePath));
  await fsExtra.writeFile(filePath, content, "utf-8");
}

/**
 * 读取文件 (别名)
 */
export async function readFile(filePath: string): Promise<string> {
  return fsExtra.readFile(filePath, "utf-8");
}

/**
 * 写入文件 (别名)
 */
export async function writeFile(filePath: string, content: string): Promise<void> {
  await fsExtra.ensureDir(dirname(filePath));
  await fsExtra.writeFile(filePath, content, "utf-8");
}

/**
 * 检查文件是否存在
 */
export async function exists(filePath: string): Promise<boolean> {
  return fsExtra.pathExists(filePath);
}

/**
 * 删除文件或目录
 */
export async function remove(filePath: string): Promise<void> {
  await fsExtra.remove(filePath);
}

/**
 * 复制文件或目录
 */
export async function copy(src: string, dest: string): Promise<void> {
  await fsExtra.copy(src, dest);
}

/**
 * 确保目录存在
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await fsExtra.ensureDir(dirPath);
}

/**
 * 列出目录内容
 */
export async function listDir(dirPath: string): Promise<string[]> {
  try {
    if (!(await fsExtra.pathExists(dirPath))) {
      return [];
    }
    return await fsExtra.readdir(dirPath);
  } catch {
    return [];
  }
}

/**
 * 读取目录 (别名)
 */
export async function readDir(dirPath: string): Promise<string[]> {
  return listDir(dirPath);
}

/**
 * 获取文件信息
 */
export async function stat(filePath: string): Promise<fsExtra.Stats | null> {
  try {
    return await fsExtra.stat(filePath);
  } catch {
    return null;
  }
}
