/**
 * AsterHub Registry 配置
 * 文档: https://asterhub.dev/docs/registry
 */
export default {
  // 你的命名空间 (需要先在 asterhub.dev 注册)
  namespace: "myns",

  // 描述
  description: "我的组件库",

  // 支持的框架
  frameworks: ["next"],

  // UI 组件
  components: [
    {
      name: "button",
      version: "1.0.0",
      style: "tailwind",
      description: "按钮组件",
      files: [
        "src/components/tailwind/button.tsx",
      ],
      dependencies: ["class-variance-authority"],
      registryDependencies: ["lib:utils"],
    },
  ],

  // Hooks
  hooks: [
    {
      name: "use-debounce",
      version: "1.0.0",
      description: "防抖 Hook",
      files: [
        "src/hooks/use-debounce.ts",
      ],
    },
  ],

  // 工具函数
  lib: [
    {
      name: "utils",
      version: "1.0.0",
      description: "工具函数",
      files: ["src/lib/utils.ts"],
      dependencies: ["clsx", "tailwind-merge"],
    },
  ],

  // 配置资源
  configs: [],
};
