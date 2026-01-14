/**
 * NextAuth 类型扩展
 */
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      dbId: number;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      githubId: string;
      githubUsername: string;
      avatarUrl?: string;
    };
  }
}
