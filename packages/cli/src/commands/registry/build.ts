/**
 * registry build - 构建 Registry
 */
import { createHash } from "crypto";
import ora from "ora";
import { logger, fs } from "../../lib";
import type { ResourceType, ResourceConfig, RegistryConfig, BuildResult } from "../../types";

const TYPE_MAP: Record<ResourceType, { dir: string; registryType: string; targetDir: string }> = {
  ui: { dir: "components", registryType: "registry:ui", targetDir: "components/ui" },
  hook: { dir: "hooks", registryType: "registry:hook", targetDir: "hooks" },
  lib: { dir: "lib", registryType: "registry:lib", targetDir: "lib" },
  config: { dir: "configs", registryType: "registry:config", targetDir: "" },
};

function calculateIntegrity(content: string): string {
  return "sha256-" + createHash("sha256").update(content).digest("base64");
}

async function buildResource(
  resource: ResourceConfig,
  type: ResourceType,
  version: string,
  distDir: string,
  cwd: string
): Promise<BuildResult> {
  const typeInfo = TYPE_MAP[type];

  const files = await Promise.all(
    resource.files.map(async (filePath) => {
      const fullPath = fs.resolve(cwd, filePath);

      if (!(await fs.exists(fullPath))) {
        throw new Error(`文件不存在: ${filePath}`);
      }

      const content = await fs.readText(fullPath);
      if (!content) throw new Error(`无法读取文件: ${filePath}`);

      if (content.length > 500 * 1024) {
        throw new Error(`文件过大: ${filePath} (最大 500KB)`);
      }

      const fileName = fs.basename(filePath);

      return {
        path: typeInfo.targetDir ? `${typeInfo.targetDir}/${fileName}` : fileName,
        type: typeInfo.registryType,
        target: typeInfo.targetDir ? `${typeInfo.targetDir}/${fileName}` : fileName,
        content,
      };
    })
  );

  const resourceJson: any = {
    name: resource.name,
    version,
    type: typeInfo.registryType,
    description: resource.description || "",
    files,
    dependencies: resource.dependencies || [],
    devDependencies: resource.devDependencies || [],
    registryDependencies: resource.registryDependencies || [],
  };

  if (type === "config") {
    if (resource.transforms) resourceJson.transforms = resource.transforms;
    if (resource.postInstall) resourceJson.postInstall = resource.postInstall;
  }

  const jsonContent = JSON.stringify(resourceJson);
  resourceJson.integrity = calculateIntegrity(jsonContent);

  let outputDir: string;
  if (type === "ui" && resource.style) {
    outputDir = fs.join(distDir, typeInfo.dir, resource.style, resource.name);
  } else {
    outputDir = fs.join(distDir, typeInfo.dir, resource.name);
  }

  await fs.ensureDir(outputDir);
  await fs.writeJson(fs.join(outputDir, "latest.json"), resourceJson);
  await fs.writeJson(fs.join(outputDir, `${version}.json`), resourceJson);

  return {
    name: resource.name,
    type,
    style: resource.style,
    description: resource.description,
    latest: version,
    versions: [version],
  };
}

function validateConfig(config: RegistryConfig): string[] {
  const errors: string[] = [];

  if (!config.namespace) {
    errors.push("缺少 namespace");
  } else if (!/^[a-z0-9-]{3,30}$/.test(config.namespace)) {
    errors.push("namespace 格式不正确");
  }

  const allResources = [
    ...(config.components || []).map((c) => ({ ...c, _type: "ui" })),
    ...(config.hooks || []).map((c) => ({ ...c, _type: "hook" })),
    ...(config.lib || []).map((c) => ({ ...c, _type: "lib" })),
    ...(config.configs || []).map((c) => ({ ...c, _type: "config" })),
  ];

  for (const resource of allResources) {
    if (!resource.name) {
      errors.push(`${resource._type} 缺少 name`);
    } else if (!/^[a-z0-9-]+$/.test(resource.name)) {
      errors.push(`${resource._type}:${resource.name} 名称格式不正确`);
    }

    if (!resource.files || resource.files.length === 0) {
      errors.push(`${resource._type}:${resource.name} 缺少 files`);
    }

    // 必须指定版本号
    if (!resource.version) {
      errors.push(`${resource._type}:${resource.name} 缺少 version`);
    } else if (!/^\d+\.\d+\.\d+$/.test(resource.version)) {
      errors.push(`${resource._type}:${resource.name} 版本号 "${resource.version}" 格式不正确`);
    }
  }

  return errors;
}

export async function registryBuild(): Promise<void> {
  const spinner = ora();
  const cwd = process.cwd();

  logger.header("🔨", "构建 Registry");

  // 查找配置文件
  const configPath = fs.resolve(cwd, "registry.config.ts");
  const configPathJs = fs.resolve(cwd, "registry.config.js");

  let actualConfigPath: string;
  if (await fs.exists(configPath)) {
    actualConfigPath = configPath;
  } else if (await fs.exists(configPathJs)) {
    actualConfigPath = configPathJs;
  } else {
    logger.error("找不到 registry.config.ts 或 registry.config.js");
    logger.dim("运行 npx asterhub registry create 创建项目");
    return;
  }

  // 读取配置
  spinner.start("读取配置...");

  let config: RegistryConfig;
  try {
    const configModule = await import(actualConfigPath);
    config = configModule.default || configModule;
  } catch (error) {
    spinner.fail("配置文件解析失败");
    logger.error((error as Error).message);
    return;
  }

  spinner.succeed("配置读取完成");

  // 验证配置
  const errors = validateConfig(config);
  if (errors.length > 0) {
    logger.error("配置验证失败:");
    errors.forEach((e) => logger.error(`  - ${e}`));
    return;
  }

  const distDir = fs.resolve(cwd, "dist");

  await fs.remove(distDir);
  await fs.ensureDir(distDir);

  // 构建资源
  const results = {
    components: [] as BuildResult[],
    hooks: [] as BuildResult[],
    lib: [] as BuildResult[],
    configs: [] as BuildResult[],
  };

  let hasError = false;

  const buildList: Array<{ items: ResourceConfig[] | undefined; type: ResourceType; key: keyof typeof results }> = [
    { items: config.components, type: "ui", key: "components" },
    { items: config.hooks, type: "hook", key: "hooks" },
    { items: config.lib, type: "lib", key: "lib" },
    { items: config.configs, type: "config", key: "configs" },
  ];

  for (const { items, type, key } of buildList) {
    if (!items?.length) continue;

    for (const item of items) {
      spinner.start(`构建 ${type}:${item.name}@${item.version}...`);
      try {
        const result = await buildResource(item, type, item.version, distDir, cwd);
        results[key].push(result);
        spinner.succeed(`${type}:${item.name}@${item.version} 构建完成`);
      } catch (error) {
        spinner.fail(`${type}:${item.name} 构建失败: ${(error as Error).message}`);
        hasError = true;
      }
    }
  }

  if (hasError) {
    logger.warn("部分资源构建失败");
    return;
  }

  // 生成 index.json
  const indexJson = {
    namespace: config.namespace,
    frameworks: config.frameworks,
    ...results,
  };

  await fs.writeJson(fs.join(distDir, "index.json"), indexJson);

  // 输出结果
  const total = results.components.length + results.hooks.length + results.lib.length + results.configs.length;

  logger.newline();
  logger.success(`构建完成! 共 ${total} 个资源`);
  logger.newline();
  logger.dim(`  UI 组件:   ${results.components.length}`);
  logger.dim(`  Hooks:     ${results.hooks.length}`);
  logger.dim(`  工具函数:  ${results.lib.length}`);
  logger.dim(`  配置:      ${results.configs.length}`);
  logger.dim(`\n  输出目录: dist/`);
  logger.dim("\n下一步: npx asterhub registry publish");
  logger.newline();
}
