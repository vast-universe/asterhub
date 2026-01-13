/**
 * 事务管理 - 安装失败自动回滚
 */
import { ASTERHUB_DIR, TRANSACTION_FILE } from "../constants";
import { readJson, writeJson, exists, join, remove, copy, ensureDir } from "../lib/fs";
import { logger } from "../lib/logger";

interface TransactionFile {
  path: string;
  backup?: string;
  isNew: boolean;
}

interface Transaction {
  id: string;
  startedAt: string;
  files: TransactionFile[];
  completed: boolean;
}

/**
 * 获取事务文件路径
 */
function getTransactionPath(cwd: string = process.cwd()): string {
  return join(cwd, ASTERHUB_DIR, TRANSACTION_FILE);
}

/**
 * 获取备份目录
 */
function getBackupDir(cwd: string = process.cwd()): string {
  return join(cwd, ASTERHUB_DIR, "backups");
}

/**
 * 开始事务
 */
export async function beginTransaction(cwd?: string): Promise<string> {
  const id = Date.now().toString(36);
  const transaction: Transaction = {
    id,
    startedAt: new Date().toISOString(),
    files: [],
    completed: false,
  };

  await ensureDir(join(cwd || process.cwd(), ASTERHUB_DIR));
  await writeJson(getTransactionPath(cwd), transaction);
  return id;
}

/**
 * 记录文件操作
 */
export async function recordFile(
  filePath: string,
  isNew: boolean,
  cwd?: string
): Promise<void> {
  const transactionPath = getTransactionPath(cwd);
  const transaction = await readJson<Transaction>(transactionPath);
  if (!transaction) return;

  const backupDir = getBackupDir(cwd);
  let backup: string | undefined;

  // 如果文件已存在，创建备份
  if (!isNew && (await exists(filePath))) {
    backup = join(backupDir, transaction.id, filePath);
    await copy(filePath, backup);
  }

  transaction.files.push({ path: filePath, backup, isNew });
  await writeJson(transactionPath, transaction);
}

/**
 * 提交事务
 */
export async function commitTransaction(cwd?: string): Promise<void> {
  const transactionPath = getTransactionPath(cwd);
  const transaction = await readJson<Transaction>(transactionPath);
  if (!transaction) return;

  transaction.completed = true;
  await writeJson(transactionPath, transaction);

  // 清理备份
  const backupDir = join(getBackupDir(cwd), transaction.id);
  if (await exists(backupDir)) {
    await remove(backupDir);
  }

  await remove(transactionPath);
}

/**
 * 回滚事务
 */
export async function rollbackTransaction(cwd?: string): Promise<void> {
  const transactionPath = getTransactionPath(cwd);
  const transaction = await readJson<Transaction>(transactionPath);
  if (!transaction) return;

  logger.info("正在回滚...");

  for (const file of transaction.files.reverse()) {
    if (file.isNew) {
      // 删除新创建的文件
      if (await exists(file.path)) {
        await remove(file.path);
        logger.info(`  删除: ${file.path}`);
      }
    } else if (file.backup) {
      // 恢复备份
      await copy(file.backup, file.path);
      logger.info(`  恢复: ${file.path}`);
    }
  }

  // 清理
  const backupDir = join(getBackupDir(cwd), transaction.id);
  if (await exists(backupDir)) {
    await remove(backupDir);
  }

  await remove(transactionPath);
  logger.success("回滚完成");
}

/**
 * 检查是否有未完成的事务
 */
export async function hasPendingTransaction(cwd?: string): Promise<boolean> {
  const transactionPath = getTransactionPath(cwd);
  const transaction = await readJson<Transaction>(transactionPath);
  return !!transaction && !transaction.completed;
}

/**
 * 获取未完成的事务
 */
export async function getPendingTransaction(cwd?: string): Promise<Transaction | null> {
  const transactionPath = getTransactionPath(cwd);
  const transaction = await readJson<Transaction>(transactionPath);
  if (transaction && !transaction.completed) {
    return transaction;
  }
  return null;
}
