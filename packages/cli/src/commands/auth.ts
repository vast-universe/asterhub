/**
 * 认证命令 - login, logout, whoami
 */
import ora from "ora";
import open from "open";
import { logger, saveCredentials, removeCredentials, getCredentials, isAuthenticated } from "../lib";
import { API_URL } from "../constants";
import { getCurrentUser } from "../services/auth";

/**
 * 登录
 */
export async function login(): Promise<void> {
  if (await isAuthenticated()) {
    const credentials = await getCredentials();
    logger.info(`已登录为 ${credentials?.user?.username || "未知用户"}`);
    return;
  }

  const spinner = ora("正在打开浏览器...").start();

  try {
    // 生成登录 URL
    const loginUrl = `${API_URL}/auth/cli`;
    await open(loginUrl);

    spinner.text = "等待登录完成...";

    // TODO: 实现 OAuth 回调处理
    // 这里需要启动一个本地服务器来接收回调
    logger.info("请在浏览器中完成登录");
    logger.info("登录完成后，请复制 Token 并运行:");
    logger.log("  ASTERHUB_TOKEN=<your-token> asterhub whoami");

    spinner.stop();
  } catch (error) {
    spinner.fail(`登录失败: ${error instanceof Error ? error.message : "未知错误"}`);
  }
}

/**
 * 退出登录
 */
export async function logout(): Promise<void> {
  await removeCredentials();
  logger.success("已退出登录");
}

/**
 * 查看当前用户
 */
export async function whoami(): Promise<void> {
  if (!(await isAuthenticated()) && !process.env.ASTERHUB_TOKEN) {
    logger.info("未登录");
    return;
  }

  const spinner = ora("正在获取用户信息...").start();

  try {
    const user = await getCurrentUser();
    spinner.stop();

    logger.log(`\n当前用户: ${user.username}`);
    logger.log(`  邮箱: ${user.email}`);
    logger.log(`  ID: ${user.id}`);
  } catch (error) {
    spinner.fail(`获取用户信息失败: ${error instanceof Error ? error.message : "未知错误"}`);
  }
}
