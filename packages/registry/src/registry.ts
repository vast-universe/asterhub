/**
 * Registry 元数据定义
 */

export interface RegistryFile {
  path: string;
  type: string;
  target?: string;
}

export interface RegistryItem {
  name: string;
  type: "ui" | "lib" | "config" | "hook";
  description: string;
  files: RegistryFile[];
  dependencies?: string[];
  devDependencies?: string[];
  registryDependencies?: string[];
}

export const registry: Record<string, Record<string, RegistryItem[]>> = {
  // Next.js 组件
  next: {
    tailwind: [
      {
        name: "button",
        type: "ui",
        description: "可点击的按钮组件，支持多种变体和尺寸",
        files: [{ path: "next/tailwind/button.tsx", type: "ui", target: "components/ui/button.tsx" }],
        dependencies: ["class-variance-authority"],
        registryDependencies: ["utils"],
      },
      {
        name: "input",
        type: "ui",
        description: "文本输入框组件",
        files: [{ path: "next/tailwind/input.tsx", type: "ui", target: "components/ui/input.tsx" }],
        registryDependencies: ["utils"],
      },
      {
        name: "card",
        type: "ui",
        description: "卡片容器组件",
        files: [{ path: "next/tailwind/card.tsx", type: "ui", target: "components/ui/card.tsx" }],
        registryDependencies: ["utils"],
      },
      {
        name: "badge",
        type: "ui",
        description: "徽章组件，用于状态标签",
        files: [{ path: "next/tailwind/badge.tsx", type: "ui", target: "components/ui/badge.tsx" }],
        dependencies: ["class-variance-authority"],
        registryDependencies: ["utils"],
      },
      {
        name: "utils",
        type: "lib",
        description: "工具函数 (cn)",
        files: [{ path: "next/lib/utils.ts", type: "lib", target: "lib/utils.ts" }],
        dependencies: ["clsx", "tailwind-merge"],
      },
    ],
  },
  // Expo 组件
  expo: {
    nativewind: [
      {
        name: "button",
        type: "ui",
        description: "可点击的按钮组件，支持多种变体和尺寸",
        files: [{ path: "expo/nativewind/button.tsx", type: "ui", target: "components/ui/button.tsx" }],
        dependencies: ["class-variance-authority"],
        registryDependencies: ["utils"],
      },
      {
        name: "input",
        type: "ui",
        description: "文本输入框组件",
        files: [{ path: "expo/nativewind/input.tsx", type: "ui", target: "components/ui/input.tsx" }],
        registryDependencies: ["utils"],
      },
      {
        name: "card",
        type: "ui",
        description: "卡片容器组件",
        files: [{ path: "expo/nativewind/card.tsx", type: "ui", target: "components/ui/card.tsx" }],
        registryDependencies: ["utils"],
      },
      {
        name: "loading",
        type: "ui",
        description: "加载指示器组件",
        files: [{ path: "expo/nativewind/loading.tsx", type: "ui", target: "components/ui/loading.tsx" }],
        registryDependencies: ["utils"],
      },
      {
        name: "utils",
        type: "lib",
        description: "工具函数 (cn)",
        files: [{ path: "expo/lib/utils.ts", type: "lib", target: "lib/utils.ts" }],
        dependencies: ["clsx", "tailwind-merge"],
      },
    ],
  },
};
