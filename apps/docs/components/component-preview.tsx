"use client";

import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
} from "@codesandbox/sandpack-react";

interface ComponentPreviewProps {
  code: string;
  dependencies?: Record<string, string>;
  registryDependencies?: string[];
  utilsCode?: string;
}

// 默认的 utils 代码
const DEFAULT_UTILS = `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`;

// 转换代码中的路径别名
function transformImports(code: string): string {
  // 将 @/lib/utils 转换为 ./lib/utils
  return code.replace(/@\/lib\/utils/g, "./lib/utils");
}

export function ComponentPreview({
  code,
  dependencies = {},
  utilsCode = DEFAULT_UTILS,
}: ComponentPreviewProps) {
  // 基础依赖
  const baseDeps = {
    react: "^18.2.0",
    "react-dom": "^18.2.0",
    clsx: "^2.1.0",
    "tailwind-merge": "^2.2.0",
    ...dependencies,
  };

  // 转换代码中的路径别名
  const transformedCode = transformImports(code);

  // 构建文件
  const files: Record<string, string> = {
    "/lib/utils.ts": utilsCode,
    "/Component.tsx": transformedCode,
    "/App.tsx": `import { Component } from "./Component";

export default function App() {
  return (
    <div className="p-8 space-y-4">
      <Component />
    </div>
  );
}`,
  };

  return (
    <SandpackProvider
      template="react-ts"
      theme="light"
      files={files}
      customSetup={{
        dependencies: baseDeps,
      }}
      options={{
        externalResources: [
          "https://cdn.tailwindcss.com",
        ],
      }}
    >
      <SandpackLayout>
        <SandpackPreview style={{ height: 300 }} />
        <SandpackCodeEditor style={{ height: 300 }} />
      </SandpackLayout>
    </SandpackProvider>
  );
}
