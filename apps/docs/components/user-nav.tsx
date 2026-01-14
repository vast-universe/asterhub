/**
 * 用户导航组件
 */
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

export async function UserNav() {
  const session = await auth();

  if (!session?.user) {
    return (
      <Link
        href="/login"
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
      >
        登录
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/dashboard" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400">
        Dashboard
      </Link>
      {session.user.avatarUrl && (
        <img
          src={session.user.avatarUrl}
          alt={session.user.githubUsername}
          className="h-8 w-8 rounded-full"
        />
      )}
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <button
          type="submit"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
        >
          退出
        </button>
      </form>
    </div>
  );
}
