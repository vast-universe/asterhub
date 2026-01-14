import { UserNav } from "@/components/user-nav";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-zinc-900 dark:text-white">
              AsterHub
            </span>
          </div>
          <nav className="flex items-center gap-6">
            <a
              href="/docs"
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            >
              文档
            </a>
            <a
              href="/components"
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            >
              组件
            </a>
            <a
              href="https://github.com/nicepkg/asterhub"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            >
              GitHub
            </a>
            <UserNav />
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-6xl">
            跨框架组件库
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            安装、管理和发布 UI 组件、Hooks、工具函数。
            <br />
            支持 Expo / React Native，预留 Vue / Nuxt 扩展。
          </p>

          {/* Quick Start */}
          <div className="mt-10 flex flex-col items-center gap-4">
            <code className="rounded-lg bg-zinc-900 px-6 py-3 text-sm text-zinc-100 dark:bg-zinc-800">
              npx asterhub add button
            </code>
            <div className="flex gap-4">
              <a
                href="/docs/getting-started"
                className="rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                快速开始
              </a>
              <a
                href="/components"
                className="rounded-full border border-zinc-300 px-6 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
              >
                浏览组件
              </a>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mx-auto mt-24 grid max-w-5xl gap-8 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
            <div className="mb-4 text-2xl">📦</div>
            <h3 className="font-semibold text-zinc-900 dark:text-white">
              组件管理
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              统一的组件添加、更新、删除流程，支持版本管理
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
            <div className="mb-4 text-2xl">🌐</div>
            <h3 className="font-semibold text-zinc-900 dark:text-white">
              社区生态
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              官方组件 + 社区组件，支持命名空间发布
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
            <div className="mb-4 text-2xl">🔒</div>
            <h3 className="font-semibold text-zinc-900 dark:text-white">
              安全检查
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              社区组件安装前自动安全扫描，保护项目安全
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-8 dark:border-zinc-800">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-zinc-500">
          MIT License © 2024 nicepkg
        </div>
      </footer>
    </div>
  );
}
