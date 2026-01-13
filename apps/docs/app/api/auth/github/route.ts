/**
 * GitHub OAuth 登录
 * GET /api/auth/github?cli=1&port=9876
 */
import { redirect } from "next/navigation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cli = searchParams.get("cli");
  const port = searchParams.get("port"); // CLI 本地服务器端口

  // 将 port 信息编码到 state 中
  const state = cli ? (port ? `cli:${port}` : "cli") : "web";

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_URL || "https://asterhub.dev"}/api/auth/github/callback`,
    scope: "read:user user:email",
    state,
  });

  redirect(`https://github.com/login/oauth/authorize?${params}`);
}
