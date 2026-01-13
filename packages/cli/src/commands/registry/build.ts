/**
 * registry build 命令 - 构建 Registry
 */
import ora from "ora";
import { logger, exists, readFile, writeJson, join, ensureDir } from "../../lib";

interface BuildOptions {
  watch?: boolean;
}

export async function registryBuild(options: BuildOptions): Promise<void> {
  const configPath = join(process.cwd(), "registry.config.ts");

  if (!(await exists(configPath))) {
    logger.error("未找到 registry.config.ts");
    logger.info("请在 Registry 项目根目录运行此命令");
    return;
  }

  const spinner = ora("正在构建...").start();

  try {
    // 动态导入配置
    const configModule = await import(`file://${configPath}`);
    const config = configModule.default;

    const distDir = join(process.cwd(), "dist");
    await ensureDir(distDir);

    // 构建组件
    if (config.components?.length) {
      for (const component of config.components) {
        spinner.text = `构建组件: ${component.name}`;
        await buildResource("components", component, config.namespace, distDir);
      }
    }

    // 构建 hooks
    if (config.hooks?.length) {
      for (const hook of config.hooks) {
        spinner.text = `构建 Hook: ${hook.name}`;
        await buildResource("hooks", hook, config.namespace, distDir);
      }
    }

    // 构建 lib
    if (config.lib?.length) {
      for (const lib of config.lib) {
        spinner.text = `构建 Lib: ${lib.name}`;
        await buildResource("lib", lib, config.namespace, distDir);
      }
    }

    spinner.succeed("构建完成");
    logger.info(`输出目录: ${distDir}`);

    if (options.watch) {
      logger.info("监听模式暂未实现");
    }
  } catch (error) {
    spinner.fail(`构建失败: ${error instanceof Error ? error.message : "未知错误"}`);
  }
}

async function buildResource(
  type: string,
  resource: {
    name: string;
    version: string;
    style?: string;
    files: string[];
    dependencies?: string[];
    devDependencies?: string[];
    registryDependencies?: string[];
    description?: string;
  },
  namespace: string,
  distDir: string
): Promise<void> {
  const files: Array<{ path: string; content: string }> = [];

  for (const filePath of resource.files) {
    const fullPath = join(process.cwd(), filePath);
    if (await exists(fullPath)) {
      const content = await readFile(fullPath);
      // 提取相对路径
      const relativePath = filePath.replace(/^src\//, "");
      files.push({ path: relativePath, content });
    }
  }

  const output = {
    name: resource.name,
    version: resource.version,
    type: type === "components" ? "ui" : type === "hooks" ? "hook" : "lib",
    namespace,
    style: resource.style,
    description: resource.description,
    files,
    dependencies: resource.dependencies || [],
    devDependencies: resource.devDependencies || [],
    registryDependencies: resource.registryDependencies || [],
  };

  // 按样式分目录
  const styleDir = resource.style || "default";
  const outputDir = join(distDir, type, styleDir, resource.name);
  await ensureDir(outputDir);

  // 输出 latest.json 和版本文件
  await writeJson(join(outputDir, "latest.json"), output);
  await writeJson(join(outputDir, `${resource.version}.json`), output);
}
