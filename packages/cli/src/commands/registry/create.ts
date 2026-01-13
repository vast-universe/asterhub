/**
 * registry create - 创建 Registry 项目
 */
import prompts from "prompts";
import { logger, fs } from "../../lib";

// ============================================
// 模板文件
// ============================================

const TEMPLATE_PACKAGE_JSON = (name: string) => ({
  name,
  version: "1.0.0",
  private: true,
  description: "My Aster Registry",
  scripts: {
    build: "npx asterhub registry build",
    "publish:registry": "npx asterhub registry publish",
  },
  devDependencies: {
    typescript: "^5.0.0",
  },
});

const TEMPLATE_TSCONFIG = {
  compilerOptions: {
    target: "ES2020",
    module: "ESNext",
    moduleResolution: "bundler",
    strict: true,
    jsx: "react-jsx",
    jsxImportSource: "react",
    esModuleInterop: true,
    skipLibCheck: true,
    baseUrl: ".",
    paths: {
      "@/*": ["./src/*"],
    },
  },
  include: ["src/**/*", "registry.config.ts"],
  exclude: ["node_modules", "dist"],
};

const TEMPLATE_CONFIG = (namespace: string) => `/**
 * Aster Registry 配置
 * 文档: https://asterhub.dev/docs/registry
 */
export default {
  // 你的命名空间 (需要先在 asterhub.dev 注册)
  namespace: "${namespace}",

  // 描述
  description: "我的组件库",

  // 支持的框架
  frameworks: ["expo"],

  // UI 组件
  components: [
    {
      name: "button",
      version: "1.0.0",
      style: "nativewind",
      description: "按钮组件",
      files: [
        "src/components/nativewind/button/button.tsx",
        "src/components/nativewind/button/index.ts",
      ],
      dependencies: [],
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
        "src/hooks/use-debounce/use-debounce.ts",
        "src/hooks/use-debounce/index.ts",
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
`;

const TEMPLATE_BUTTON = `import { forwardRef } from "react";
import { Pressable, Text, type PressableProps } from "react-native";
import { cn } from "@/lib/utils";

export interface ButtonProps extends Omit<PressableProps, "children"> {
  children: React.ReactNode;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Button = forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(
  ({ children, variant = "default", size = "md", className, ...props }, ref) => {
    const variantStyles = {
      default: "bg-primary active:bg-primary/90",
      outline: "border border-input bg-transparent active:bg-accent",
      ghost: "bg-transparent active:bg-accent",
    };

    const sizeStyles = {
      sm: "h-9 px-3",
      md: "h-10 px-4",
      lg: "h-11 px-6",
    };

    const textVariantStyles = {
      default: "text-primary-foreground",
      outline: "text-foreground",
      ghost: "text-foreground",
    };

    return (
      <Pressable
        ref={ref}
        className={cn(
          "flex-row items-center justify-center rounded-md",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {typeof children === "string" ? (
          <Text className={cn("font-medium", textVariantStyles[variant])}>
            {children}
          </Text>
        ) : (
          children
        )}
      </Pressable>
    );
  }
);

Button.displayName = "Button";
`;

const TEMPLATE_BUTTON_INDEX = `export { Button, type ButtonProps } from "./button";
`;

const TEMPLATE_UTILS = `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 合并 Tailwind CSS 类名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;

const TEMPLATE_USE_DEBOUNCE = `import { useState, useEffect } from "react";

/**
 * 防抖 Hook
 * @param value 需要防抖的值
 * @param delay 延迟时间 (毫秒)
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
`;

const TEMPLATE_USE_DEBOUNCE_INDEX = `export { useDebounce } from "./use-debounce";
`;

const TEMPLATE_GITIGNORE = `# Dependencies
node_modules/

# Build output
dist/

# IDE
.idea/
.vscode/
*.swp

# OS
.DS_Store
Thumbs.db

# Logs
*.log

# Backup
*.bak
`;

const TEMPLATE_README = (name: string) => `# ${name}

Aster 组件库项目。

## 快速开始

\`\`\`bash
# 安装依赖
npm install

# 构建
npm run build

# 发布
npx asterhub login
npm run publish:registry
\`\`\`

## 目录结构

\`\`\`
src/
├── components/           # UI 组件
│   └── nativewind/
│       └── button/
├── hooks/                # Hooks
│   └── use-debounce/
├── lib/                  # 工具函数
│   └── utils.ts
└── configs/              # 配置资源
\`\`\`

## 添加新组件

1. 在 \`src/components/nativewind/\` 下创建组件目录
2. 在 \`registry.config.ts\` 中注册组件
3. 运行 \`npm run build\` 构建
4. 运行 \`npm run publish:registry\` 发布

## 文档

- [Aster 文档](https://asterhub.dev/docs)
- [创建组件指南](https://asterhub.dev/docs/registry)
`;

// ============================================
// 创建命令
// ============================================

export async function registryCreate(name?: string): Promise<void> {
  logger.header("📦", "创建 Registry 项目");

  // 获取项目名称
  if (!name) {
    const response = await prompts({
      type: "text",
      name: "name",
      message: "项目名称:",
      initial: "my-aster-registry",
      validate: (value) => {
        if (!value) return "请输入项目名称";
        if (!/^[a-z0-9-]+$/.test(value)) return "只能包含小写字母、数字、连字符";
        return true;
      },
    });
    name = response.name;
  }

  if (!name) {
    logger.warn("已取消");
    return;
  }

  // 获取命名空间
  const { namespace } = await prompts({
    type: "text",
    name: "namespace",
    message: "命名空间 (你的用户名):",
    initial: name.replace(/-registry$/, ""),
    validate: (value) => {
      if (!value) return "请输入命名空间";
      if (!/^[a-z0-9-]{3,30}$/.test(value)) return "3-30个字符，只能包含小写字母、数字、连字符";
      return true;
    },
  });

  if (!namespace) {
    logger.warn("已取消");
    return;
  }

  const targetDir = fs.resolve(process.cwd(), name);

  // 检查目录是否已存在
  if (await fs.exists(targetDir)) {
    const { overwrite } = await prompts({
      type: "confirm",
      name: "overwrite",
      message: `目录 ${name} 已存在，是否覆盖?`,
      initial: false,
    });

    if (!overwrite) {
      logger.warn("已取消");
      return;
    }

    await fs.remove(targetDir);
  }

  logger.newline();
  logger.dim(`创建项目: ${targetDir}`);
  logger.newline();

  try {
    // 创建目录结构
    await fs.ensureDir(fs.join(targetDir, "src/components/nativewind/button"));
    await fs.ensureDir(fs.join(targetDir, "src/hooks/use-debounce"));
    await fs.ensureDir(fs.join(targetDir, "src/lib"));
    await fs.ensureDir(fs.join(targetDir, "src/configs"));

    // 写入配置文件
    await fs.writeJson(fs.join(targetDir, "package.json"), TEMPLATE_PACKAGE_JSON(name));
    await fs.writeJson(fs.join(targetDir, "tsconfig.json"), TEMPLATE_TSCONFIG);
    await fs.writeText(fs.join(targetDir, "registry.config.ts"), TEMPLATE_CONFIG(namespace));
    await fs.writeText(fs.join(targetDir, ".gitignore"), TEMPLATE_GITIGNORE);
    await fs.writeText(fs.join(targetDir, "README.md"), TEMPLATE_README(name));

    // 写入示例组件
    await fs.writeText(
      fs.join(targetDir, "src/components/nativewind/button/button.tsx"),
      TEMPLATE_BUTTON
    );
    await fs.writeText(
      fs.join(targetDir, "src/components/nativewind/button/index.ts"),
      TEMPLATE_BUTTON_INDEX
    );

    // 写入工具函数
    await fs.writeText(fs.join(targetDir, "src/lib/utils.ts"), TEMPLATE_UTILS);

    // 写入 Hook
    await fs.writeText(
      fs.join(targetDir, "src/hooks/use-debounce/use-debounce.ts"),
      TEMPLATE_USE_DEBOUNCE
    );
    await fs.writeText(
      fs.join(targetDir, "src/hooks/use-debounce/index.ts"),
      TEMPLATE_USE_DEBOUNCE_INDEX
    );

    logger.success("项目创建成功!");
    logger.newline();
    logger.dim("下一步:");
    logger.newline();
    logger.log(`  cd ${name}`);
    logger.log("  npm install");
    logger.log("  npm run build");
    logger.newline();
    logger.dim("发布:");
    logger.newline();
    logger.log("  npx asterhub login");
    logger.log("  npm run publish:registry");
    logger.newline();
  } catch (error) {
    logger.error(`创建失败: ${(error as Error).message}`);
  }
}
