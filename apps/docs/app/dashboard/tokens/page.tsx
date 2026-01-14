/**
 * Token 管理页面
 */
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTokensByUserId, createToken, revokeToken } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export default async function TokensPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.dbId;
  const tokens = await getTokensByUserId(userId);

  // 获取刚创建的 token（从 cookie 中）
  const cookieStore = await cookies();
  const newToken = cookieStore.get("new_token")?.value;

  async function handleCreate(formData: FormData) {
    "use server";

    const session = await auth();
    if (!session?.user) return;

    const name = formData.get("name") as string;
    const scope = formData.get("scope") as string;

    if (!name || name.length < 1 || name.length > 50) return;

    const { rawToken } = await createToken(session.user.dbId, name, scope || "publish");

    // 将新 token 存入 cookie（只显示一次）
    const cookieStore = await cookies();
    cookieStore.set("new_token", rawToken, {
      maxAge: 60, // 1 分钟后过期
      httpOnly: false,
    });

    revalidatePath("/dashboard/tokens");
  }

  async function handleRevoke(formData: FormData) {
    "use server";

    const session = await auth();
    if (!session?.user) return;

    const tokenId = parseInt(formData.get("tokenId") as string);
    if (!tokenId) return;

    await revokeToken(session.user.dbId, tokenId);

    revalidatePath("/dashboard/tokens");
  }

  async function clearNewToken() {
    "use server";
    const cookieStore = await cookies();
    cookieStore.delete("new_token");
    revalidatePath("/dashboard/tokens");
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-xl font-bold text-zinc-900 dark:text-white">
            AsterHub
          </Link>
          <Link href="/dashboard" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400">
            ← 返回 Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">API Tokens</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          创建和管理用于 CLI 发布的访问令牌
        </p>

        {/* New Token Alert */}
        {newToken && (
          <div className="mt-6 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
            <p className="font-medium text-green-800 dark:text-green-200">Token 创建成功！</p>
            <p className="mt-1 text-sm text-green-700 dark:text-green-300">
              请立即复制保存，此 Token 只会显示一次：
            </p>
            <code className="mt-2 block break-all rounded bg-green-100 px-3 py-2 text-sm text-green-900 dark:bg-green-900/40 dark:text-green-100">
              {newToken}
            </code>
            <form action={clearNewToken} className="mt-2">
              <button type="submit" className="text-sm text-green-600 hover:underline dark:text-green-400">
                我已复制，关闭提示
              </button>
            </form>
          </div>
        )}

        {/* Create Token Form */}
        <section className="mt-8 rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">创建新 Token</h2>
          <form action={handleCreate} className="mt-4 flex gap-4">
            <input
              type="text"
              name="name"
              required
              placeholder="Token 名称"
              maxLength={50}
              className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
            />
            <select
              name="scope"
              className="rounded-lg border border-zinc-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="publish">publish (发布组件)</option>
              <option value="read">read (只读)</option>
            </select>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700"
            >
              创建
            </button>
          </form>
        </section>

        {/* Token List */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            已有 Tokens ({tokens.length})
          </h2>

          {tokens.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
              <p className="text-zinc-600 dark:text-zinc-400">还没有创建任何 Token</p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {tokens.map((token) => (
                <div
                  key={token.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">{token.name}</p>
                    <p className="text-sm text-zinc-500">
                      scope: {Array.isArray(token.scopes) ? token.scopes.join(", ") : token.scopes} · 创建于{" "}
                      {new Date(token.created_at).toLocaleDateString("zh-CN")}
                    </p>
                    {token.last_used_at && (
                      <p className="text-sm text-zinc-500">
                        最后使用: {new Date(token.last_used_at).toLocaleDateString("zh-CN")}
                      </p>
                    )}
                  </div>
                  <form action={handleRevoke}>
                    <input type="hidden" name="tokenId" value={token.id} />
                    <button
                      type="submit"
                      className="rounded bg-red-100 px-3 py-1.5 text-sm text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                    >
                      撤销
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Usage Guide */}
        <section className="mt-12 rounded-lg bg-zinc-100 p-6 dark:bg-zinc-900">
          <h3 className="font-semibold text-zinc-900 dark:text-white">使用方法</h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            在 CLI 中使用 Token 进行身份验证：
          </p>
          <code className="mt-2 block rounded bg-zinc-800 px-4 py-2 text-sm text-zinc-100">
            npx asterhub login --token YOUR_TOKEN
          </code>
        </section>
      </main>
    </div>
  );
}
