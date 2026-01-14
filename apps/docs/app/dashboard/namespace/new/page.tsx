/**
 * 创建命名空间页面
 */
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createNamespace, canCreateNamespace, getNamespaceByName } from "@/lib/db";
import { revalidatePath } from "next/cache";

export default async function NewNamespacePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.dbId;

  // 检查是否可以创建新命名空间
  const canCreate = await canCreateNamespace(userId);

  async function handleCreate(formData: FormData) {
    "use server";

    const session = await auth();
    if (!session?.user) return;

    const name = formData.get("name") as string;

    // 验证名称
    if (!name || !/^[a-z][a-z0-9-]*$/.test(name) || name.length < 3 || name.length > 30) {
      return;
    }

    // 检查是否已存在
    const existing = await getNamespaceByName(name);
    if (existing) {
      return;
    }

    // 检查配额
    const canCreate = await canCreateNamespace(session.user.dbId);
    if (!canCreate) {
      return;
    }

    // 创建命名空间
    await createNamespace(session.user.dbId, name, false);

    revalidatePath("/dashboard");
    redirect("/dashboard");
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

      <main className="mx-auto max-w-xl px-6 py-12">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">创建命名空间</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          命名空间用于组织你的组件，类似于 npm 的 scope
        </p>

        {!canCreate ? (
          <div className="mt-8 rounded-lg bg-yellow-50 p-6 dark:bg-yellow-900/20">
            <p className="text-yellow-800 dark:text-yellow-200">
              你已达到命名空间数量上限，请删除一些不需要的命名空间后再试
            </p>
          </div>
        ) : (
          <form action={handleCreate} className="mt-8 space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-zinc-900 dark:text-white">
                命名空间名称
              </label>
              <div className="mt-2 flex items-center">
                <span className="text-zinc-500">@</span>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  pattern="^[a-z][a-z0-9-]*$"
                  minLength={3}
                  maxLength={30}
                  placeholder="my-components"
                  className="ml-1 flex-1 rounded-lg border border-zinc-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <p className="mt-2 text-sm text-zinc-500">
                3-30 个字符，只能包含小写字母、数字和连字符，必须以字母开头
              </p>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-zinc-900 dark:text-white">
                描述（可选）
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                maxLength={200}
                placeholder="我的组件库..."
                className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700"
              >
                创建
              </button>
              <Link
                href="/dashboard"
                className="rounded-lg border border-zinc-300 px-6 py-2 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                取消
              </Link>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
