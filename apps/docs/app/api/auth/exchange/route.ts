/**
 * Token Exchange API
 * 用 GitHub access token 换取 AsterHub token
 * POST /api/auth/exchange
 */
import { NextResponse } from "next/server";
import { createUser, getUserByGithubId, createToken, createNamespace } from "@/lib/db";

interface GitHubUser {
  id: number;
  login: string;
  email: string | null;
  avatar_url: string;
}

interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const githubAccessToken = body.github_access_token;

    if (!githubAccessToken) {
      return NextResponse.json({ error: "Missing github_access_token" }, { status: 400 });
    }

    // 1. 验证 GitHub token 并获取用户信息
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${githubAccessToken}`,
        Accept: "application/json",
      },
    });

    if (!userRes.ok) {
      return NextResponse.json({ error: "Invalid GitHub token" }, { status: 401 });
    }

    const githubUser: GitHubUser = await userRes.json();

    // 2. 获取邮箱（如果用户邮箱为空）
    let email = githubUser.email;
    if (!email) {
      try {
        const emailsRes = await fetch("https://api.github.com/user/emails", {
          headers: {
            Authorization: `Bearer ${githubAccessToken}`,
            Accept: "application/json",
          },
        });
        if (emailsRes.ok) {
          const emails: GitHubEmail[] = await emailsRes.json();
          const primary = emails.find((e) => e.primary && e.verified);
          email = primary?.email || emails.find((e) => e.verified)?.email || emails[0]?.email || null;
          console.log("[Exchange] Fetched emails:", emails.length, "Primary:", email);
        } else {
          console.log("[Exchange] Failed to fetch emails:", emailsRes.status);
        }
      } catch (err) {
        console.log("[Exchange] Email fetch error:", err);
      }
    }

    // 3. 创建或获取用户
    let user = await getUserByGithubId(githubUser.id.toString());
    if (!user) {
      user = await createUser({
        githubId: githubUser.id.toString(),
        githubUsername: githubUser.login,
        email: email || undefined,
        avatarUrl: githubUser.avatar_url,
      });
      // 创建默认命名空间
      await createNamespace(user.id, githubUser.login, true);
    } else {
      // 更新用户信息
      const { updateUser } = await import("@/lib/db");
      console.log("[Exchange] Updating user:", user.id, "email:", email);
      const updated = await updateUser(user.id, {
        github_username: githubUser.login,
        email: email || user.email,
        avatar_url: githubUser.avatar_url,
      });
      console.log("[Exchange] Updated user:", updated?.email);
      if (email) user.email = email;
    }

    // 4. 创建 AsterHub token
    const { rawToken } = await createToken(user.id, "CLI Token (Device Flow)", "publish");

    return NextResponse.json({ token: rawToken });
  } catch (error) {
    console.error("Token exchange error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
