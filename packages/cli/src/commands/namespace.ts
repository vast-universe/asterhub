/**
 * 命名空间命令 - create, list, delete
 */
import ora from "ora";
import prompts from "prompts";
import { logger, isLoggedIn } from "../lib";
import { fetchNamespaces, createNamespace, deleteNamespace } from "../services";
import { validateNamespace } from "../core";

/**
 * 创建命名空间
 */
export async function namespaceCreate(name: string): Promise<void> {
  // 检查登录
  if (!(await isLoggedIn())) {
    logger.error("请先登录: npx asterhub login");
    return;
  }

  // 验证名称
  const validation = validateNamespace(name);
  if (!validation.valid) {
    logger.error(validation.error!);
    return;
  }

  const spinner = ora(`创建命名空间 @${name}...`).start();

  try {
    await createNamespace(name);
    spinner.succeed(`命名空间 @${name} 创建成功!`);
    logger.newline();
    logger.dim(`现在可以发布组件到 @${name}`);
    logger.dim("运行 npx asterhub registry create 创建组件库项目");
    logger.newline();
  } catch (error) {
    spinner.fail("创建失败");
    logger.error((error as Error).message);
  }
}

/**
 * 列出命名空间
 */
export async function namespaceList(): Promise<void> {
  if (!(await isLoggedIn())) {
    logger.error("请先登录: npx asterhub login");
    return;
  }

  const spinner = ora("获取命名空间列表...").start();

  try {
    const namespaces = await fetchNamespaces();
    spinner.stop();

    if (namespaces.length === 0) {
      logger.warn("你还没有命名空间");
      logger.dim("运行 npx asterhub namespace create <name> 创建");
      return;
    }

    logger.header("📦", "我的命名空间");

    for (const ns of namespaces) {
      const verified = ns.verified ? " ✓" : "";
      const isDefault = ns.isDefault ? " (默认)" : "";
      logger.log(`  @${ns.name}${verified}${isDefault}`);
      if (ns.description) {
        logger.dim(`    ${ns.description}`);
      }
    }

    logger.newline();
  } catch (error) {
    spinner.fail("获取失败");
    logger.error((error as Error).message);
  }
}

/**
 * 删除命名空间
 */
export async function namespaceDelete(name: string): Promise<void> {
  if (!(await isLoggedIn())) {
    logger.error("请先登录: npx asterhub login");
    return;
  }

  // 确认删除
  const { confirm } = await prompts({
    type: "confirm",
    name: "confirm",
    message: `确定要删除命名空间 @${name}? 这将删除所有已发布的资源!`,
    initial: false,
  });

  if (!confirm) {
    logger.dim("已取消");
    return;
  }

  // 二次确认
  const { confirmName } = await prompts({
    type: "text",
    name: "confirmName",
    message: `请输入命名空间名称 "${name}" 确认删除:`,
  });

  if (confirmName !== name) {
    logger.warn("名称不匹配，已取消");
    return;
  }

  const spinner = ora(`删除命名空间 @${name}...`).start();

  try {
    await deleteNamespace(name);
    spinner.succeed(`命名空间 @${name} 已删除`);
  } catch (error) {
    spinner.fail("删除失败");
    logger.error((error as Error).message);
  }
}
