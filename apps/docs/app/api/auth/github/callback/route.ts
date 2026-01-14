/**
 * GitHub OAuth 回调
 * GET /api/auth/github/callback
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { nanoid } from "nanoid";
import { createUser, getUserByGithubId, createToken, createNamespace } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state") || "";

  if (!code) {
    return new Response("Missing code", { status: 400 });
  }

  // 解析 state: "web" | "cli" | "cli:9876"
  const isCli = state.startsWith("cli");
  const cliPort = state.startsWith("cli:") ? state.split(":")[1] : null;
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3002";

  try {
    // 1. 获取 access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const { access_token, error } = await tokenRes.json();
    if (error || !access_token) {
      if (cliPort) {
        return NextResponse.redirect(`http://127.0.0.1:${cliPort}?error=${encodeURIComponent(error || "OAuth failed")}`);
      }
      return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(error || "OAuth failed")}`);
    }

    // 2. 获取用户信息
    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const githubUser = await userRes.json();

    // 2.1 如果邮箱为空，尝试获取主邮箱
    let email = githubUser.email;
    if (!email) {
      try {
        const emailsRes = await fetch("https://api.github.com/user/emails", {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        const emails = await emailsRes.json();
        const primary = emails.find((e: { primary: boolean; email: string }) => e.primary);
        email = primary?.email || emails[0]?.email;
      } catch {
        // 忽略邮箱获取失败
      }
    }

    // 3. 创建或获取用户
    let user = await getUserByGithubId(githubUser.id.toString());
    if (!user) {
      user = await createUser({
        githubId: githubUser.id.toString(),
        githubUsername: githubUser.login,
        email: email,
        avatarUrl: githubUser.avatar_url,
      });
      // 创建默认命名空间
      await createNamespace(user.id, githubUser.login, true);
    }

    // 4. 生成 token
    const tokenName = isCli ? "CLI Token" : "Web Session";
    const { rawToken } = await createToken(user.id, tokenName, "publish");

    // 5. 返回
    if (cliPort) {
      // CLI 登录 (有端口)，重定向到本地服务器
      return NextResponse.redirect(`http://127.0.0.1:${cliPort}?token=${rawToken}`);
    }

    if (isCli) {
      // CLI 登录 (无端口，降级到手动复制)
      return new Response(
        `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>AsterHub 登录成功</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      text-align: center;
      max-width: 500px;
    }
    h1 { color: #22c55e; margin-bottom: 20px; }
    .token {
      background: #f0f0f0;
      padding: 15px 20px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 14px;
      word-break: break-all;
      margin: 20px 0;
      cursor: pointer;
    }
    .token:hover { background: #e5e5e5; }
    .hint { color: #666; font-size: 14px; }
    .copied { color: #22c55e; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <h1>✅ 登录成功!</h1>
    <p>欢迎, <strong>${user.github_username}</strong></p>
    <p>请复制以下 Token 到终端:</p>
    <div class="token" onclick="copyToken()" id="token">${rawToken}</div>
    <p class="hint" id="hint">点击复制</p>
    <p class="hint">此页面可以关闭</p>
  </div>
  <script>
    function copyToken() {
      navigator.clipboard.writeText('${rawToken}');
      document.getElementById('hint').innerHTML = '<span class="copied">已复制!</span>';
    }
  </script>
</body>
</html>`,
        { headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // Web 登录，设置 session cookie 并跳转到 dashboard
    const cookieStore = await cookies();
    cookieStore.set("session_token", rawToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
    });

    return NextResponse.redirect(`${baseUrl}/dashboard`);
  } catch (error) {
    console.error("OAuth error:", error);
    if (cliPort) {
      return NextResponse.redirect(`http://127.0.0.1:${cliPort}?error=${encodeURIComponent("Authentication failed")}`);
    }
    return NextResponse.redirect(`${baseUrl}/login?error=auth_failed`);
  }
}
