/**
 * 用户 Dashboard 页面
 */
import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { sql } from "@vercel/postgres";

// 一次查询获取用户的所有命名空间及其组件数量
async function getNamespacesWithStats(userId: number) {
  const { rows } = await sql`
    SELECT 
      n.id, n.name, n.description, n.is_default,
      COUNT(r.id)::int as component_count
    FROM namespaces n
    LEFT JOIN registry_items r ON r.namespace_id = n.id
    WHERE n.user_id = ${userId}
    GROUP BY n.id
    ORDER BY n.is_default DESC, n.created_at DESC
  `;
  return rows;
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;
  const namespaces = await getNamespacesWithStats(user.dbId);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-xl font-bold text-zinc-900 dark:text-white">
            AsterHub
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/components" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400">
              组件库
            </Link>
            <div className="flex items-center gap-3">
              {user.avatarUrl && (
                <img src={user.avatarUrl} alt={user.githubUsername} className="h-8 w-8 rounded-full" />
              )}
              <span className="text-sm text-zinc-900 dark:text-white">{user.githubUsername}</span>
              <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
                <button type="submit" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
                  退出
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Dashboard</h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">管理你的组件和命名空间</p>
          </div>
          <Link
            href="/dashboard/namespace/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            创建命名空间
          </Link>
        </div>

        <section className="mt-12">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
            我的命名空间 ({namespaces.length})
          </h2>

          {namespaces.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
              <p className="text-zinc-600 dark:text-zinc-400">你还没有创建任何命名空间</p>
              <Link href="/dashboard/namespace/new" className="mt-4 inline-block text-blue-600 hover:underline">
                创建第一个命名空间
              </Link>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {namespaces.map((ns) => (
                <div key={ns.id} className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">@{ns.name}</h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {ns.description || "暂无描述"} · {ns.component_count} 个组件
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/namespace/${ns.name}`}
                        className="rounded bg-zinc-100 px-3 py-1.5 text-sm hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                      >
                        管理
                      </Link>
                      <Link
                        href={`/dashboard/namespace/${ns.name}/publish`}
                        className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                      >
                        发布组件
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">快速操作</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/dashboard/tokens" className="rounded-lg border border-zinc-200 p-6 transition-colors hover:border-zinc-400 dark:border-zinc-800">
              <h3 className="font-semibold text-zinc-900 dark:text-white">API Tokens</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">管理用于 CLI 发布的访问令牌</p>
            </Link>
            <Link href="/docs/cli" className="rounded-lg border border-zinc-200 p-6 transition-colors hover:border-zinc-400 dark:border-zinc-800">
              <h3 className="font-semibold text-zinc-900 dark:text-white">CLI 文档</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">了解如何使用 CLI 发布组件</p>
            </Link>
            <Link href="/components" className="rounded-lg border border-zinc-200 p-6 transition-colors hover:border-zinc-400 dark:border-zinc-800">
              <h3 className="font-semibold text-zinc-900 dark:text-white">浏览组件</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">探索社区发布的组件</p>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
