/**
 * AsterHub 官方组件库配置
 */
export default {
  namespace: "asterhub",
  description: "AsterHub 官方组件库",
  frameworks: ["next"],

  // UI 组件
  components: [
    {
      name: "button",
      version: "1.0.0",
      style: "tailwind",
      description: "可点击的按钮组件，支持多种变体和尺寸",
      files: ["src/next/tailwind/button.tsx"],
      dependencies: ["class-variance-authority"],
      registryDependencies: ["lib:utils"],
    },
    {
      name: "input",
      version: "1.0.0",
      style: "tailwind",
      description: "文本输入框组件",
      files: ["src/next/tailwind/input.tsx"],
      registryDependencies: ["lib:utils"],
    },
    {
      name: "card",
      version: "1.0.0",
      style: "tailwind",
      description: "卡片容器组件",
      files: ["src/next/tailwind/card.tsx"],
      registryDependencies: ["lib:utils"],
    },
    {
      name: "badge",
      version: "1.0.0",
      style: "tailwind",
      description: "徽章组件，用于状态标签",
      files: ["src/next/tailwind/badge.tsx"],
      dependencies: ["class-variance-authority"],
      registryDependencies: ["lib:utils"],
    },
  ],

  // 工具函数
  lib: [
    {
      name: "utils",
      version: "1.0.0",
      description: "工具函数 (cn)",
      files: ["src/next/lib/utils.ts"],
      dependencies: ["clsx", "tailwind-merge"],
    },
  ],

  // Hooks
  hooks: [],

  // 配置
  configs: [],
};
