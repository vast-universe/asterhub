/**
 * registry create 命令 - 创建 Registry 项目
 */
import prompts from "prompts";
import ora from "ora";
import { logger, ensureDir, writeFile, writeJson, join } from "../../lib";

interface CreateOptions {
  namespace?: string;
}

export async function registryCreate(name?: string, options: CreateOptions = {}): Promise<void> {
  let projectName = name;
  let namespace = options.namespace;

  if (!projectName) {
    const answers = await prompts([
      {
        type: "text",
        name: "name",
        message: "项目名称",
        initial: "my-registry",
        validate: (v) => (v ? true : "请输入项目名称"),
      },
      {
        type: "text",
        name: "namespace",
        message: "命名空间 (可选)",
      },
    ]);

    if (!answers.name) return;
    projectName = answers.name as string;
    namespace = answers.namespace || namespace;
  }

  // TypeScript narrowing
  const finalName: string = projectName;
  const finalNamespace = namespace || "my-namespace";

  const spinner = ora(`正在创建 ${finalName}...`).start();

  try {
    const projectDir = join(process.cwd(), finalName);
    await ensureDir(projectDir);

    // 创建 package.json
    await writeJson(join(projectDir, "package.json"), {
      name: finalName,
      version: "1.0.0",
      private: true,
      scripts: {
        build: "asterhub registry build",
        publish: "asterhub registry publish",
      },
      devDependencies: {
        asterhub: "^0.1.0",
        typescript: "^5.3.0",
      },
    });

    // 创建 tsconfig.json
    await writeJson(join(projectDir, "tsconfig.json"), {
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "Node",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        jsx: "react-jsx",
      },
      include: ["src/**/*"],
    });

    // 创建 registry.config.ts
    await writeFile(
      join(projectDir, "registry.config.ts"),
      `import type { RegistryConfig } from "asterhub";

export default {
  namespace: "${finalNamespace}",
  description: "我的组件库",
  frameworks: ["expo"],

  components: [
    {
      name: "example-button",
      version: "1.0.0",
      style: "nativewind",
      description: "示例按钮组件",
      files: [
        "src/components/nativewind/example-button/example-button.tsx",
        "src/components/nativewind/example-button/index.ts",
      ],
      dependencies: [],
      registryDependencies: ["lib:utils"],
    },
  ],

  hooks: [
    // {
    //   name: "use-example",
    //   version: "1.0.0",
    //   description: "示例 Hook",
    //   files: ["src/hooks/use-example/index.ts"],
    // },
  ],

  lib: [
    {
      name: "utils",
      version: "1.0.0",
      description: "工具函数",
      files: ["src/lib/utils.ts"],
      dependencies: ["clsx", "tailwind-merge"],
    },
  ],
} satisfies RegistryConfig;
`
    );

    // 创建示例组件
    await ensureDir(join(projectDir, "src/components/nativewind/example-button"));
    await writeFile(
      join(projectDir, "src/components/nativewind/example-button/example-button.tsx"),
      `import { Pressable, Text } from "react-native";
import { cn } from "@/lib/utils";

interface ExampleButtonProps {
  children: React.ReactNode;
  variant?: "default" | "outline";
  onPress?: () => void;
  className?: string;
}

export function ExampleButton({
  children,
  variant = "default",
  onPress,
  className,
}: ExampleButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "px-4 py-2 rounded-lg",
        variant === "default" && "bg-blue-500",
        variant === "outline" && "border border-blue-500",
        className
      )}
    >
      <Text
        className={cn(
          "text-center font-medium",
          variant === "default" && "text-white",
          variant === "outline" && "text-blue-500"
        )}
      >
        {children}
      </Text>
    </Pressable>
  );
}
`
    );

    await writeFile(
      join(projectDir, "src/components/nativewind/example-button/index.ts"),
      `export { ExampleButton } from "./example-button";
`
    );

    // 创建 utils
    await ensureDir(join(projectDir, "src/lib"));
    await writeFile(
      join(projectDir, "src/lib/utils.ts"),
      `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`
    );

    // 创建 README
    await writeFile(
      join(projectDir, "README.md"),
      `# ${finalName}

AsterHub Registry 项目

## 开发

\`\`\`bash
# 安装依赖
pnpm install

# 构建
pnpm build

# 发布
pnpm publish
\`\`\`

## 目录结构

\`\`\`
src/
  components/
    nativewind/
      example-button/
        example-button.tsx
        index.ts
  hooks/
  lib/
    utils.ts
registry.config.ts
\`\`\`
`
    );

    spinner.succeed(`项目 ${finalName} 创建成功`);
    logger.break();
    logger.log("下一步:");
    logger.log(`  cd ${finalName}`);
    logger.log("  pnpm install");
    logger.log("  pnpm build");
  } catch (error) {
    spinner.fail(`创建失败: ${error instanceof Error ? error.message : "未知错误"}`);
  }
}
