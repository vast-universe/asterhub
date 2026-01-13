/**
 * 安装事务管理 - 原子操作支持
 */
import { ASTER_DIR, TRANSACTION_FILE } from "../constants";
import { fs, logger } from "../lib";
import type { FileOperation, TransactionState } from "../types";

/**
 * 安装事务类
 */
export class InstallTransaction {
  private operations: FileOperation[] = [];
  private backups: Map<string, string> = new Map();
  private createdDirs: Set<string> = new Set();
  private stateFile: string;
  private id: string;

  constructor(private cwd: string) {
    this.id = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.stateFile = fs.join(cwd, ASTER_DIR, TRANSACTION_FILE);
  }

  /**
   * 开始事务
   */
  async begin(): Promise<void> {
    // 检查是否有未完成的事务
    const existing = await fs.readJson<TransactionState>(this.stateFile);
    if (existing && !existing.completed) {
      throw new Error(`存在未完成的事务 (${existing.id})，请先运行 npx asterhub recover`);
    }

    // 保存事务状态
    await fs.ensureDir(fs.dirname(this.stateFile));
    await fs.writeJson(this.stateFile, {
      id: this.id,
      startedAt: new Date().toISOString(),
      operations: [],
      completed: false,
    } as TransactionState);
  }

  /**
   * 写入文件（带备份）
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    const fullPath = fs.resolve(this.cwd, filePath);

    // 如果文件存在，先备份
    const existingContent = await fs.readText(fullPath);
    if (existingContent !== null) {
      this.backups.set(fullPath, existingContent);
    }

    // 确保目录存在
    const dir = fs.dirname(fullPath);
    if (!(await fs.exists(dir))) {
      await fs.ensureDir(dir);
      this.createdDirs.add(dir);
    }

    // 写入文件
    await fs.writeText(fullPath, content);

    // 记录操作
    this.operations.push({
      type: "write",
      path: fullPath,
      content,
      backup: this.backups.get(fullPath),
    });

    await this.saveState();
  }

  /**
   * 删除文件（带备份）
   */
  async deleteFile(filePath: string): Promise<void> {
    const fullPath = fs.resolve(this.cwd, filePath);

    const existingContent = await fs.readText(fullPath);
    if (existingContent !== null) {
      this.backups.set(fullPath, existingContent);
      await fs.remove(fullPath);

      this.operations.push({
        type: "delete",
        path: fullPath,
        backup: existingContent,
      });

      await this.saveState();
    }
  }

  /**
   * 提交事务
   */
  async commit(): Promise<void> {
    await fs.writeJson(this.stateFile, {
      id: this.id,
      startedAt: new Date().toISOString(),
      operations: this.operations,
      completed: true,
    } as TransactionState);

    this.backups.clear();
    this.operations = [];
  }

  /**
   * 回滚事务
   */
  async rollback(): Promise<void> {
    logger.warn("正在回滚更改...");
    logger.newline();

    // 逆序回滚操作
    for (const op of [...this.operations].reverse()) {
      try {
        if (op.type === "write") {
          if (op.backup !== undefined) {
            await fs.writeText(op.path, op.backup);
            logger.dim(`  恢复: ${this.relativePath(op.path)}`);
          } else {
            await fs.remove(op.path);
            logger.dim(`  删除: ${this.relativePath(op.path)}`);
          }
        } else if (op.type === "delete" && op.backup) {
          await fs.writeText(op.path, op.backup);
          logger.dim(`  恢复: ${this.relativePath(op.path)}`);
        }
      } catch {
        logger.error(`  回滚失败: ${this.relativePath(op.path)}`);
      }
    }

    // 删除创建的空目录
    for (const dir of this.createdDirs) {
      try {
        const files = await fs.listDir(dir);
        if (files.length === 0) {
          await fs.remove(dir);
        }
      } catch {
        // 忽略
      }
    }

    // 清理事务状态
    await fs.remove(this.stateFile);

    logger.newline();
    logger.success("回滚完成");
  }

  /**
   * 保存事务状态
   */
  private async saveState(): Promise<void> {
    await fs.writeJson(this.stateFile, {
      id: this.id,
      startedAt: new Date().toISOString(),
      operations: this.operations,
      completed: false,
    } as TransactionState);
  }

  /**
   * 获取相对路径
   */
  private relativePath(fullPath: string): string {
    return fullPath.replace(this.cwd + "/", "");
  }

  /**
   * 获取操作数量
   */
  get operationCount(): number {
    return this.operations.length;
  }
}

/**
 * 恢复未完成的事务
 */
export async function recoverTransaction(cwd: string): Promise<boolean> {
  const stateFile = fs.join(cwd, ASTER_DIR, TRANSACTION_FILE);
  const state = await fs.readJson<TransactionState>(stateFile);

  if (!state) {
    logger.dim("没有需要恢复的事务");
    return false;
  }

  if (state.completed) {
    await fs.remove(stateFile);
    logger.dim("事务已完成，无需恢复");
    return false;
  }

  logger.warn(`发现未完成的事务: ${state.id}`);
  logger.dim(`开始时间: ${state.startedAt}`);
  logger.dim(`操作数量: ${state.operations.length}`);
  logger.newline();

  // 回滚操作
  logger.warn("正在回滚...");
  logger.newline();

  for (const op of [...state.operations].reverse()) {
    try {
      if (op.type === "write") {
        if (op.backup !== undefined) {
          await fs.writeText(op.path, op.backup);
          logger.dim(`  恢复: ${op.path}`);
        } else {
          await fs.remove(op.path);
          logger.dim(`  删除: ${op.path}`);
        }
      } else if (op.type === "delete" && op.backup) {
        await fs.writeText(op.path, op.backup);
        logger.dim(`  恢复: ${op.path}`);
      }
    } catch {
      logger.error(`  失败: ${op.path}`);
    }
  }

  await fs.remove(stateFile);
  logger.newline();
  logger.success("恢复完成");

  return true;
}
