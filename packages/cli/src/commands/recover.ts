/**
 * recover 命令 - 恢复未完成的安装事务
 */
import prompts from "prompts";
import { logger } from "../lib";
import { hasPendingTransaction, getPendingTransaction, rollbackTransaction, commitTransaction } from "../core/transaction";

export async function recover(): Promise<void> {
  if (!(await hasPendingTransaction())) {
    logger.info("没有未完成的事务");
    return;
  }

  const transaction = await getPendingTransaction();
  if (!transaction) return;

  logger.warn(`发现未完成的事务 (${transaction.startedAt})`);
  logger.log(`  涉及 ${transaction.files.length} 个文件`);

  const { action } = await prompts({
    type: "select",
    name: "action",
    message: "选择操作",
    choices: [
      { title: "回滚 - 撤销所有更改", value: "rollback" },
      { title: "提交 - 保留当前状态", value: "commit" },
      { title: "取消", value: "cancel" },
    ],
  });

  switch (action) {
    case "rollback":
      await rollbackTransaction();
      break;
    case "commit":
      await commitTransaction();
      logger.success("事务已提交");
      break;
    default:
      break;
  }
}
