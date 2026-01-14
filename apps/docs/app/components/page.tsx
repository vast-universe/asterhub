import Link from "next/link";

interface ComponentItem {
  namespace: string;
  name: string;
  type: string;
  description?: string;
  downloads: number;
}

async function getComponents(): Promise<ComponentItem[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
  const res = await fetch(`${baseUrl}/api/registry?framework=next&style=tailwind&limit=100`, {
    next: { revalidate: 60 },
  });
  const data = await res.json();
  return data.items || [];
}

export default async function ComponentsPage() {
  const components = await getComponents();
  const uiComponents = components.filter((c) => c.type === "ui");
  const libs = components.filter((c) => c.type === "lib");
  const hooks = components.filter((c) => c.type === "hook");

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-xl font-bold text-zinc-900 dark:text-white">
            AsterHub
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/docs" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400">
              文档
            </Link>
            <Link href="/components" className="text-sm font-medium text-zinc-900 dark:text-white">
              组件
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">组件库</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          浏览所有可用的 UI 组件、Hooks 和工具函数
        </p>

        {/* UI Components */}
        {uiComponents.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">UI 组件</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {uiComponents.map((component) => (
                <Link
                  key={component.name}
                  href={`/components/${component.name}`}
                  className="group rounded-lg border border-zinc-200 p-6 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                >
                  <h3 className="font-semibold text-zinc-900 group-hover:text-blue-600 dark:text-white">
                    {component.name}
                  </h3>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {component.description || "暂无描述"}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
                    <span>↓ {component.downloads}</span>
                    <span>•</span>
                    <span>@{component.namespace}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Libs */}
        {libs.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">工具函数</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {libs.map((lib) => (
                <Link
                  key={lib.name}
                  href={`/components/lib:${lib.name}`}
                  className="group rounded-lg border border-zinc-200 p-6 transition-colors hover:border-zinc-400 dark:border-zinc-800"
                >
                  <h3 className="font-semibold text-zinc-900 group-hover:text-blue-600 dark:text-white">
                    lib:{lib.name}
                  </h3>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {lib.description || "暂无描述"}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Hooks */}
        {hooks.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Hooks</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {hooks.map((hook) => (
                <Link
                  key={hook.name}
                  href={`/components/hook:${hook.name}`}
                  className="group rounded-lg border border-zinc-200 p-6 transition-colors hover:border-zinc-400 dark:border-zinc-800"
                >
                  <h3 className="font-semibold text-zinc-900 group-hover:text-blue-600 dark:text-white">
                    hook:{hook.name}
                  </h3>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {hook.description || "暂无描述"}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Install hint */}
        <div className="mt-16 rounded-lg bg-zinc-100 p-6 dark:bg-zinc-900">
          <h3 className="font-semibold text-zinc-900 dark:text-white">安装组件</h3>
          <code className="mt-2 block rounded bg-zinc-800 px-4 py-2 text-sm text-zinc-100">
            npx asterhub add button
          </code>
        </div>
      </main>
    </div>
  );
}
