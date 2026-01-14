/**
 * registry create - 创建 Registry 项目 (Next.js)
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
  description: "My AsterHub Registry",
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
 * AsterHub Registry 配置
 * 文档: https://asterhub.dev/docs/registry
 */
export default {
  // 你的命名空间 (需要先在 asterhub.dev 注册)
  namespace: "${namespace}",

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
`;

const TEMPLATE_BUTTON = `import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
`;

const TEMPLATE_UTILS = `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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

AsterHub 组件库项目。

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
│   └── tailwind/
│       └── button.tsx
├── hooks/                # Hooks
│   └── use-debounce.ts
└── lib/                  # 工具函数
    └── utils.ts
\`\`\`

## 添加新组件

1. 在 \`src/components/tailwind/\` 下创建组件文件
2. 在 \`registry.config.ts\` 中注册组件
3. 运行 \`npm run build\` 构建
4. 运行 \`npm run publish:registry\` 发布

## 文档

- [AsterHub 文档](https://asterhub.dev/docs)
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
      initial: "my-asterhub-registry",
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
    await fs.ensureDir(fs.join(targetDir, "src/components/tailwind"));
    await fs.ensureDir(fs.join(targetDir, "src/hooks"));
    await fs.ensureDir(fs.join(targetDir, "src/lib"));

    // 写入配置文件
    await fs.writeJson(fs.join(targetDir, "package.json"), TEMPLATE_PACKAGE_JSON(name));
    await fs.writeJson(fs.join(targetDir, "tsconfig.json"), TEMPLATE_TSCONFIG);
    await fs.writeText(fs.join(targetDir, "registry.config.ts"), TEMPLATE_CONFIG(namespace));
    await fs.writeText(fs.join(targetDir, ".gitignore"), TEMPLATE_GITIGNORE);
    await fs.writeText(fs.join(targetDir, "README.md"), TEMPLATE_README(name));

    // 写入示例组件
    await fs.writeText(
      fs.join(targetDir, "src/components/tailwind/button.tsx"),
      TEMPLATE_BUTTON
    );

    // 写入工具函数
    await fs.writeText(fs.join(targetDir, "src/lib/utils.ts"), TEMPLATE_UTILS);

    // 写入 Hook
    await fs.writeText(
      fs.join(targetDir, "src/hooks/use-debounce.ts"),
      TEMPLATE_USE_DEBOUNCE
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
