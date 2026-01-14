import Link from "next/link";
import { notFound } from "next/navigation";
import { ComponentPreview } from "@/components/component-preview";

interface ComponentData {
  name: string;
  version: string;
  type: string;
  description?: string;
  files: Array<{
    path: string;
    content: string;
  }>;
  dependencies?: string[];
  devDependencies?: string[];
  registryDependencies?: string[];
}

async function getComponent(name: string): Promise<ComponentData | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
  
  // 解析类型前缀
  let type = "ui";
  let actualName = name;
  if (name.startsWith("lib:")) {
    type = "lib";
    actualName = name.slice(4);
  } else if (name.startsWith("hook:")) {
    type = "hook";
    actualName = name.slice(5);
  }

  const url = type === "ui" 
    ? `${baseUrl}/api/registry/asterhub/${actualName}/latest?style=tailwind`
    : `${baseUrl}/api/registry/asterhub/${type}:${actualName}/latest`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// 获取 utils 代码（如果组件依赖它）
async function getUtils(): Promise<string | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
  try {
    const res = await fetch(`${baseUrl}/api/registry/asterhub/lib:utils/latest`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.files?.[0]?.content || null;
  } catch {
    return null;
  }
}

// 生成预览代码
function generatePreviewCode(component: ComponentData): string {
  const mainFile = component.files[0];
  if (!mainFile) return "";

  // 提取组件名（从 export 语句）
  const exportMatch = mainFile.content.match(/export\s+(?:const|function)\s+(\w+)/);
  const componentName = exportMatch?.[1] || "Component";

  // 转换路径别名
  const transformedContent = mainFile.content.replace(/@\/lib\/utils/g, "./lib/utils");

  // 根据组件类型生成不同的预览
  if (component.name === "button") {
    return `${transformedContent}

// 预览示例
export function Component() {
  return (
    <div className="flex flex-wrap gap-4">
      <${componentName}>Default</${componentName}>
      <${componentName} variant="secondary">Secondary</${componentName}>
      <${componentName} variant="destructive">Destructive</${componentName}>
      <${componentName} variant="outline">Outline</${componentName}>
      <${componentName} variant="ghost">Ghost</${componentName}>
      <${componentName} variant="link">Link</${componentName}>
      <${componentName} size="sm">Small</${componentName}>
      <${componentName} size="lg">Large</${componentName}>
    </div>
  );
}`;
  }

  if (component.name === "input") {
    return `${transformedContent}

export function Component() {
  return (
    <div className="flex flex-col gap-4 max-w-sm">
      <${componentName} placeholder="默认输入框" />
      <${componentName} type="email" placeholder="邮箱" />
      <${componentName} type="password" placeholder="密码" />
      <${componentName} disabled placeholder="禁用状态" />
    </div>
  );
}`;
  }

  if (component.name === "badge") {
    return `${transformedContent}

export function Component() {
  return (
    <div className="flex flex-wrap gap-2">
      <${componentName}>Default</${componentName}>
      <${componentName} variant="secondary">Secondary</${componentName}>
      <${componentName} variant="destructive">Destructive</${componentName}>
      <${componentName} variant="success">Success</${componentName}>
      <${componentName} variant="warning">Warning</${componentName}>
      <${componentName} variant="outline">Outline</${componentName}>
    </div>
  );
}`;
  }

  if (component.name === "card") {
    return `${transformedContent}

export function Component() {
  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>卡片标题</CardTitle>
        <CardDescription>卡片描述信息</CardDescription>
      </CardHeader>
      <CardContent>
        <p>这是卡片的主要内容区域。</p>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-gray-500">卡片底部</p>
      </CardFooter>
    </Card>
  );
}`;
  }

  // 默认预览
  return `${transformedContent}

export function Component() {
  return <${componentName} />;
}`;
}

export default async function ComponentPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  
  // 并行获取组件和 utils
  const [component, utilsCode] = await Promise.all([
    getComponent(name),
    getUtils(),
  ]);

  if (!component) {
    notFound();
  }

  const previewCode = generatePreviewCode(component);
  const mainFile = component.files[0];

  // 构建依赖对象
  const deps: Record<string, string> = {};
  component.dependencies?.forEach((dep) => {
    deps[dep] = "latest";
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-xl font-bold text-zinc-900 dark:text-white">
            AsterHub
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/components" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400">
              ← 返回组件库
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Title */}
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            {component.name}
          </h1>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800">
            v{component.version}
          </span>
        </div>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          {component.description || "暂无描述"}
        </p>

        {/* Install */}
        <div className="mt-6">
          <code className="rounded bg-zinc-800 px-4 py-2 text-sm text-zinc-100">
            npx asterhub add {name}
          </code>
        </div>

        {/* Preview */}
        {component.type === "registry:ui" && (
          <section className="mt-12">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">预览</h2>
            <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
              <ComponentPreview
                code={previewCode}
                dependencies={deps}
                utilsCode={utilsCode || undefined}
              />
            </div>
          </section>
        )}

        {/* Code */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">源代码</h2>
          <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="bg-zinc-100 px-4 py-2 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
              {mainFile?.path}
            </div>
            <pre className="overflow-x-auto bg-zinc-900 p-4 text-sm text-zinc-100">
              <code>{mainFile?.content}</code>
            </pre>
          </div>
        </section>

        {/* Dependencies */}
        {(component.dependencies?.length || component.registryDependencies?.length) && (
          <section className="mt-12">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">依赖</h2>
            <div className="mt-4 space-y-4">
              {component.dependencies && component.dependencies.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">npm 依赖</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {component.dependencies.map((dep) => (
                      <span
                        key={dep}
                        className="rounded bg-zinc-200 px-2 py-1 text-sm dark:bg-zinc-800"
                      >
                        {dep}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {component.registryDependencies && component.registryDependencies.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Registry 依赖</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {component.registryDependencies.map((dep) => (
                      <Link
                        key={dep}
                        href={`/components/${dep}`}
                        className="rounded bg-blue-100 px-2 py-1 text-sm text-blue-800 hover:bg-blue-200"
                      >
                        {dep}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
