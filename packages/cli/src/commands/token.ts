/**
 * token 命令 - 管理 API Token
 */
import ora from "ora";
import prompts from "prompts";
import { logger, getToken } from "../lib";
import { get, post, del } from "../lib/http";
import type { TokenInfo } from "../types";

/**
 * 列出所有 Token
 */
export async function tokenList(): Promise<void> {
  const spinner = ora();

  const token = await getToken();
  if (!token) {
    logger.error("请先登录: npx asterhub login");
    return;
  }

  logger.header("🔑", "我的 Token");

  spinner.start("获取 Token 列表...");

  try {
    const { tokens } = await get<{ tokens: TokenInfo[] }>("/api/auth/tokens", { auth: true });
    spinner.stop();

    if (!tokens || tokens.length === 0) {
      logger.dim("没有 Token");
      return;
    }

    logger.newline();
    for (const t of tokens) {
      const scopes = t.scopes?.join(", ") || "all";
      const lastUsed = t.lastUsedAt ? new Date(t.lastUsedAt).toLocaleDateString() : "从未使用";
      const expires = t.expiresAt ? new Date(t.expiresAt).toLocaleDateString() : "永不过期";

      logger.log(`  ${t.name || "未命名"} (${t.id})`);
      logger.dim(`    权限: ${scopes}`);
      logger.dim(`    最后使用: ${lastUsed}`);
      logger.dim(`    过期时间: ${expires}`);
      logger.newline();
    }
  } catch (error) {
    spinner.fail("获取失败");
    logger.error((error as Error).message);
  }
}

/**
 * 创建新 Token
 */
export async function tokenCreate(options: { name?: string; scope?: string } = {}): Promise<void> {
  const spinner = ora();

  const token = await getToken();
  if (!token) {
    logger.error("请先登录: npx asterhub login");
    return;
  }

  logger.header("🔑", "创建 Token");

  // 获取 Token 名称
  let name = options.name;
  if (!name) {
    const answer = await prompts({
      type: "text",
      name: "name",
      message: "Token 名称:",
      initial: "CLI Token",
    });
    name = answer.name;
  }

  if (!name) {
    logger.dim("已取消");
    return;
  }

  // 获取权限范围
  let scopes = options.scope?.split(",") || [];
  if (scopes.length === 0) {
    const answer = await prompts({
      type: "multiselect",
      name: "scopes",
      message: "选择权限:",
      choices: [
        { title: "读取 (read)", value: "read", selected: true },
        { title: "发布 (publish)", value: "publish", selected: true },
        { title: "删除 (delete)", value: "delete" },
      ],
      min: 1,
    });
    scopes = answer.scopes || ["read", "publish"];
  }

  spinner.start("创建 Token...");

  try {
    const result = await post<{ token: string; id: string }>(
      "/api/auth/tokens",
      { name, scopes },
      { auth: true }
    );

    spinner.succeed("Token 创建成功");

    logger.newline();
    logger.warn("请保存以下 Token，它只会显示一次:");
    logger.newline();
    logger.log(`  ${result.token}`);
    logger.newline();
    logger.dim("使用方法:");
    logger.dim("  export ASTER_TOKEN=<token>");
    logger.dim("  或在 CI 中设置环境变量");
    logger.newline();
  } catch (error) {
    spinner.fail("创建失败");
    logger.error((error as Error).message);
  }
}

/**
 * 撤销 Token
 */
export async function tokenRevoke(id: string): Promise<void> {
  const spinner = ora();

  const token = await getToken();
  if (!token) {
    logger.error("请先登录: npx asterhub login");
    return;
  }

  if (!id) {
    logger.error("请指定 Token ID");
    logger.dim("用法: npx asterhub token revoke <id>");
    logger.dim("运行 npx asterhub token list 查看所有 Token");
    return;
  }

  // 确认
  const { confirm } = await prompts({
    type: "confirm",
    name: "confirm",
    message: `确定撤销 Token ${id}?`,
    initial: false,
  });

  if (!confirm) {
    logger.dim("已取消");
    return;
  }

  spinner.start("撤销 Token...");

  try {
    await del(`/api/auth/tokens/${id}`, { auth: true });
    spinner.succeed("Token 已撤销");
  } catch (error) {
    spinner.fail("撤销失败");
    logger.error((error as Error).message);
  }
}
