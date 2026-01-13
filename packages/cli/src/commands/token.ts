/**
 * Token 管理命令
 */
import prompts from "prompts";
import ora from "ora";
import { logger, isAuthenticated } from "../lib";
import { getTokens, createToken, revokeToken } from "../services/auth";

/**
 * 列出所有 Token
 */
export async function tokenList(): Promise<void> {
  if (!(await isAuthenticated())) {
    logger.error("请先登录");
    return;
  }

  const spinner = ora("正在获取 Token 列表...").start();

  try {
    const tokens = await getTokens();
    spinner.stop();

    if (tokens.length === 0) {
      logger.info("没有 Token");
      return;
    }

    logger.log("\nToken 列表:\n");
    for (const token of tokens) {
      logger.log(`  ${token.name} (${token.id})`);
      logger.log(`    权限: ${token.scopes.join(", ")}`);
      logger.log(`    创建时间: ${token.createdAt}`);
      if (token.lastUsedAt) {
        logger.log(`    最后使用: ${token.lastUsedAt}`);
      }
      logger.break();
    }
  } catch (error) {
    spinner.fail(`获取失败: ${error instanceof Error ? error.message : "未知错误"}`);
  }
}

/**
 * 创建 Token
 */
export async function tokenCreate(options: { name?: string; scope?: string }): Promise<void> {
  if (!(await isAuthenticated())) {
    logger.error("请先登录");
    return;
  }

  let name = options.name;
  let scopes = options.scope?.split(",").map((s) => s.trim()) || [];

  if (!name) {
    const answers = await prompts([
      {
        type: "text",
        name: "name",
        message: "Token 名称",
        validate: (v) => (v ? true : "请输入名称"),
      },
      {
        type: "multiselect",
        name: "scopes",
        message: "选择权限",
        choices: [
          { title: "read - 读取资源", value: "read" },
          { title: "write - 发布资源", value: "write" },
          { title: "delete - 删除资源", value: "delete" },
        ],
        min: 1,
      },
    ]);

    if (!answers.name) return;
    name = answers.name;
    scopes = answers.scopes;
  }

  const spinner = ora("正在创建 Token...").start();

  try {
    const result = await createToken(name, scopes);
    spinner.stop();

    logger.success("Token 创建成功");
    logger.break();
    logger.log(`  Token: ${result.token}`);
    logger.break();
    logger.warn("请妥善保存此 Token，它只会显示一次");
  } catch (error) {
    spinner.fail(`创建失败: ${error instanceof Error ? error.message : "未知错误"}`);
  }
}

/**
 * 撤销 Token
 */
export async function tokenRevoke(id: string): Promise<void> {
  if (!(await isAuthenticated())) {
    logger.error("请先登录");
    return;
  }

  const { confirm } = await prompts({
    type: "confirm",
    name: "confirm",
    message: `确定要撤销 Token ${id} 吗?`,
    initial: false,
  });

  if (!confirm) return;

  const spinner = ora("正在撤销 Token...").start();

  try {
    await revokeToken(id);
    spinner.succeed("Token 已撤销");
  } catch (error) {
    spinner.fail(`撤销失败: ${error instanceof Error ? error.message : "未知错误"}`);
  }
}
