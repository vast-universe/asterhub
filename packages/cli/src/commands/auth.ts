/**
 * 认证命令 - login, logout, whoami
 */
import http from "http";
import ora from "ora";
import prompts from "prompts";
import open from "open";
import { API_URL } from "../constants";
import { logger, writeCredentials, clearCredentials, readCredentials, getToken } from "../lib";
import { get, del } from "../lib/http";
import { verifyToken } from "../services";
import type { TokenInfo } from "../types";

/**
 * 撤销所有 CLI Token
 */
async function revokeOldCliTokens(): Promise<void> {
  try {
    const { tokens } = await get<{ tokens: TokenInfo[] }>("/api/auth/tokens", { auth: true });
    const cliTokens = tokens?.filter((t) => t.name?.startsWith("CLI Token")) || [];
    
    for (const t of cliTokens) {
      try {
        await del(`/api/auth/tokens/${t.id}`, { auth: true });
      } catch {
        // 忽略撤销失败
      }
    }
  } catch {
    // 忽略获取失败
  }
}

/**
 * 启动本地服务器等待 OAuth 回调
 */
function startCallbackServer(port: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url || "/", `http://localhost:${port}`);
      const token = url.searchParams.get("token");
      const error = url.searchParams.get("error");

      // 返回 HTML 页面
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      
      if (error) {
        res.end(`
          <!DOCTYPE html>
          <html>
          <head><title>登录失败</title></head>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #ef4444;">❌ 登录失败</h1>
            <p>${error}</p>
            <p>请关闭此页面，返回终端重试</p>
          </body>
          </html>
        `);
        server.close();
        reject(new Error(error));
        return;
      }

      if (token) {
        res.end(`
          <!DOCTYPE html>
          <html>
          <head><title>登录成功</title></head>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #22c55e;">✅ 登录成功!</h1>
            <p>请返回终端查看结果</p>
            <p style="color: #666;">此页面可以关闭</p>
          </body>
          </html>
        `);
        server.close();
        resolve(token);
        return;
      }

      res.end("Invalid request");
      server.close();
      reject(new Error("Invalid callback"));
    });

    server.listen(port, "127.0.0.1", () => {
      // 服务器启动成功
    });

    server.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        reject(new Error(`端口 ${port} 已被占用`));
      } else {
        reject(err);
      }
    });

    // 超时处理 (3 分钟)
    setTimeout(() => {
      server.close();
      reject(new Error("登录超时，请重试"));
    }, 3 * 60 * 1000);
  });
}

/**
 * 查找可用端口
 */
async function findAvailablePort(startPort: number): Promise<number> {
  for (let port = startPort; port < startPort + 100; port++) {
    try {
      await new Promise<void>((resolve, reject) => {
        const server = http.createServer();
        server.listen(port, "127.0.0.1", () => {
          server.close();
          resolve();
        });
        server.on("error", reject);
      });
      return port;
    } catch {
      continue;
    }
  }
  throw new Error("找不到可用端口");
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

    // 撤销旧的 CLI Token
    logger.dim("清理旧的 Token...");
    await revokeOldCliTokens();
  }

  const spinner = ora("准备登录...").start();

  try {
    // 启动本地服务器
    const port = await findAvailablePort(9876);
    spinner.text = "正在打开浏览器...";

    // 打开浏览器
    const authUrl = `${API_URL}/api/auth/github?cli=1&port=${port}`;
    
    try {
      await open(authUrl);
    } catch {
      // 忽略打开浏览器失败
    }

    spinner.text = "等待 GitHub 授权...";
    logger.newline();
    logger.dim(`如果浏览器没有自动打开，请手动访问:`);
    logger.dim(authUrl);
    logger.newline();

    // 等待回调
    const token = await startCallbackServer(port);

    spinner.text = "验证 Token...";

    // 验证 token
    const user = await verifyToken(token);

    await writeCredentials({
      token,
      user,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    });

    spinner.succeed("登录成功!");
    logger.newline();
    logger.item("用户", user.username);
    logger.item("邮箱", user.email || "未设置");
    logger.item("命名空间", user.namespaces.map((n) => "@" + n).join(", "));
    logger.newline();
  } catch (error) {
    spinner.fail((error as Error).message || "登录失败");
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
