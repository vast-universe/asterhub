/**
 * 命名空间管理命令
 */
import prompts from "prompts";
import ora from "ora";
import { logger, isAuthenticated } from "../lib";
import { getNamespaces, createNamespace, deleteNamespace } from "../services/registry";

/**
 * 创建命名空间
 */
export async function namespaceCreate(name: string): Promise<void> {
  if (!(await isAuthenticated())) {
    logger.error("请先登录");
    return;
  }

  const spinner = ora(`正在创建命名空间 ${name}...`).start();

  try {
    await createNamespace(name);
    spinner.succeed(`命名空间 ${name} 创建成功`);
  } catch (error) {
    spinner.fail(`创建失败: ${error instanceof Error ? error.message : "未知错误"}`);
  }
}

/**
 * 列出命名空间
 */
export async function namespaceList(): Promise<void> {
  if (!(await isAuthenticated())) {
    logger.error("请先登录");
    return;
  }

  const spinner = ora("正在获取命名空间列表...").start();

  try {
    const namespaces = await getNamespaces();
    spinner.stop();

    if (namespaces.length === 0) {
      logger.info("没有命名空间");
      return;
    }

    logger.log("\n我的命名空间:\n");
    for (const ns of namespaces) {
      logger.log(`  @${ns.name}`);
      if (ns.description) {
        logger.log(`    ${ns.description}`);
      }
    }
  } catch (error) {
    spinner.fail(`获取失败: ${error instanceof Error ? error.message : "未知错误"}`);
  }
}

/**
 * 删除命名空间
 */
export async function namespaceDelete(name: string): Promise<void> {
  if (!(await isAuthenticated())) {
    logger.error("请先登录");
    return;
  }

  const { confirm } = await prompts({
    type: "confirm",
    name: "confirm",
    message: `确定要删除命名空间 @${name} 吗? 这将删除所有相关资源!`,
    initial: false,
  });

  if (!confirm) return;

  const spinner = ora(`正在删除命名空间 ${name}...`).start();

  try {
    await deleteNamespace(name);
    spinner.succeed(`命名空间 ${name} 已删除`);
  } catch (error) {
    spinner.fail(`删除失败: ${error instanceof Error ? error.message : "未知错误"}`);
  }
}
