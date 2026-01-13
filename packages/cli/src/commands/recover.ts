/**
 * recover 命令 - 恢复未完成的事务
 */
import { recoverTransaction } from "../core";

export async function recover(): Promise<void> {
  await recoverTransaction(process.cwd());
}
