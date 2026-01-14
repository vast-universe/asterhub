/**
 * NextAuth 配置
 */
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { getUserByGithubId, createUser, updateUser, createNamespace } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "github" && profile) {
        const githubId = String(profile.id);
        const githubUsername = profile.login as string;
        const email = user.email || undefined;
        const avatarUrl = user.image || undefined;

        // 查找或创建用户
        let dbUser = await getUserByGithubId(githubId);
        if (!dbUser) {
          dbUser = await createUser({
            githubId,
            githubUsername,
            email,
            avatarUrl,
          });
          // 创建默认命名空间
          await createNamespace(dbUser.id, githubUsername, true);
        } else {
          // 更新用户信息
          await updateUser(dbUser.id, {
            github_username: githubUsername,
            email,
            avatar_url: avatarUrl,
          });
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (token.githubId) {
        const dbUser = await getUserByGithubId(token.githubId as string);
        if (dbUser) {
          session.user.id = String(dbUser.id);
          session.user.dbId = dbUser.id;
          session.user.githubId = dbUser.github_id;
          session.user.githubUsername = dbUser.github_username;
          session.user.avatarUrl = dbUser.avatar_url;
        }
      }
      return session;
    },
    async jwt({ token, account, profile }) {
      if (account?.provider === "github" && profile) {
        token.githubId = String(profile.id);
        token.githubUsername = profile.login;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
  },
});


/**
 * 验证 API Token（用于 CLI 认证）
 */
import { getUserByToken } from "./db";
import type { User } from "@/types";

export async function verifyToken(request: Request): Promise<User | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);
  return getUserByToken(token);
}
