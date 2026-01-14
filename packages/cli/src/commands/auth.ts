/**
 * 认证命令 - login, logout, whoami
 * 使用 GitHub Device Flow
 */
import ora from "ora";
import prompts from "prompts";
import open from "open";
import { GITHUB_CLIENT_ID } from "../constants";
import { logger, writeCredentials, clearCredentials, readCredentials, getToken } from "../lib";
import { post } from "../lib/http";
import { verifyToken } from "../services";

interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

interface TokenResponse {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

/**
 * 请求 Device Code
 */
async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  const res = await fetch("https://github.com/login/device/code", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      scope: "read:user user:email",
    }),
  });

  if (!res.ok) {
    throw new Error("无法获取设备代码");
  }

  return res.json();
}

/**
 * 轮询获取 Access Token
 */
async function pollForToken(deviceCode: string, interval: number, expiresIn: number): Promise<string> {
  const startTime = Date.now();
  const expiresAt = startTime + expiresIn * 1000;

  while (Date.now() < expiresAt) {
    await new Promise((resolve) => setTimeout(resolve, interval * 1000));

    const res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        device_code: deviceCode,
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      }),
    });

    const data: TokenResponse = await res.json();

    if (data.access_token) {
      return data.access_token;
    }

    if (data.error === "authorization_pending") {
      continue;
    }

    if (data.error === "slow_down") {
      interval += 5;
      continue;
    }

    if (data.error === "expired_token") {
      throw new Error("验证码已过期，请重新登录");
    }

    if (data.error === "access_denied") {
      throw new Error("用户拒绝授权");
    }

    if (data.error) {
      throw new Error(data.error_description || data.error);
    }
  }

  throw new Error("登录超时，请重试");
}

/**
 * 用 GitHub access token 换取 AsterHub token
 */
async function exchangeToken(githubAccessToken: string): Promise<string> {
  const data = await post<{ token: string }>("/api/auth/exchange", {
    github_access_token: githubAccessToken,
  });
  return data.token;
}

/**
 * 登录
 */
export async function login(): Promise<void> {
  logger.header("🔐", "登录 AsterHub");

  // 检查是否已登录
  const existingToken = await getToken();
  if (existingToken) {
    const { overwrite } = await prompts({
      type: "confirm",
      name: "overwrite",
      message: "你已经登录，是否重新登录?",
      initial: false,
    });

    if (!overwrite) {
      logger.dim("已取消");
      return;
    }
  }

  const spinner = ora("正在连接 GitHub...").start();

  try {
    // 1. 请求 Device Code
    const deviceCode = await requestDeviceCode();
    spinner.stop();

    // 2. 显示验证码
    logger.newline();
    logger.log("请访问以下地址完成授权:");
    logger.newline();
    logger.log(`  ${deviceCode.verification_uri}`);
    logger.newline();
    logger.log("并输入验证码:");
    logger.newline();
    logger.log(`  ${deviceCode.user_code}`);
    logger.newline();

    // 尝试自动打开浏览器
    try {
      await open(deviceCode.verification_uri);
      logger.dim("已自动打开浏览器");
    } catch {
      // 忽略
    }

    logger.newline();
    const pollSpinner = ora("等待授权...").start();

    // 3. 轮询获取 Token
    const githubToken = await pollForToken(
      deviceCode.device_code,
      deviceCode.interval,
      deviceCode.expires_in
    );

    pollSpinner.text = "正在创建 AsterHub Token...";

    // 4. 换取 AsterHub Token
    const asterhubToken = await exchangeToken(githubToken);

    // 5. 验证并保存
    const user = await verifyToken(asterhubToken);

    await writeCredentials({
      token: asterhubToken,
      user,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    });

    pollSpinner.succeed("登录成功!");
    logger.newline();
    logger.item("用户", user.username);
    logger.item("邮箱", user.email || "未设置");
    logger.item("命名空间", user.namespaces.map((n) => "@" + n).join(", "));
    logger.newline();
  } catch (error) {
    logger.error((error as Error).message || "登录失败");
  }
}

/**
 * 登出
 */
export async function logout(): Promise<void> {
  const credentials = await readCredentials();

  if (!credentials?.token) {
    logger.warn("你还没有登录");
    return;
  }

  const { confirm } = await prompts({
    type: "confirm",
    name: "confirm",
    message: "确定要退出登录吗?",
    initial: true,
  });

  if (!confirm) {
    logger.dim("已取消");
    return;
  }

  await clearCredentials();
  logger.success("已退出登录");
}

/**
 * 查看当前用户
 */
export async function whoami(): Promise<void> {
  const credentials = await readCredentials();

  if (!credentials?.token) {
    logger.warn("未登录");
    logger.dim("运行 npx asterhub login 进行登录");
    return;
  }

  const spinner = ora("获取用户信息...").start();

  try {
    const user = await verifyToken(credentials.token);

    await writeCredentials({ ...credentials, user });

    spinner.stop();

    logger.header("👤", "当前用户");
    logger.item("用户名", user.username);
    logger.item("邮箱", user.email || "未设置");
    logger.item("命名空间", user.namespaces.map((n) => "@" + n).join(", "));
    logger.newline();
  } catch {
    spinner.fail("Token 已过期，请重新登录");
    logger.dim("运行 npx asterhub login 重新登录");
  }
}
