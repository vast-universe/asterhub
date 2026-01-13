/**
 * registry publish - 发布 Registry
 */
import ora from "ora";
import { logger, fs, getToken, getUserInfo } from "../../lib";
import { publishResources } from "../../services";
import { MAX_PUBLISH_SIZE } from "../../constants";
import type { PublishOptions } from "../../types";

type ResourceTypeKey = "components" | "hooks" | "lib" | "configs";

async function collectResources(distDir: string, type: ResourceTypeKey, index: any): Promise<any[]> {
  const resources: any[] = [];
  const items = index[type] || [];

  for (const item of items) {
    let resourcePath: string;

    if (type === "components" && item.style) {
      resourcePath = fs.join(distDir, type, item.style, item.name, "latest.json");
    } else {
      resourcePath = fs.join(distDir, type, item.name, "latest.json");
    }

    const content = await fs.readJson<any>(resourcePath);
    if (content) {
      resources.push({
        name: item.name,
        type,
        style: item.style,
        version: content.version,
        content,
      });
    }
  }

  return resources;
}

export async function registryPublish(options: PublishOptions = {}): Promise<void> {
  const spinner = ora();
  const cwd = process.cwd();

  logger.header("🚀", "发布 Registry");

  // 检查登录
  const token = await getToken();
  if (!token) {
    logger.error("请先登录: npx asterhub login");
    return;
  }

  // 检查 dist 目录
  const distDir = fs.resolve(cwd, "dist");
  const indexPath = fs.join(distDir, "index.json");

  if (!(await fs.exists(indexPath))) {
    logger.error("找不到 dist/index.json");
    logger.dim("请先运行 npx asterhub registry build");
    return;
  }

  // 读取构建产物
  spinner.start("读取构建产物...");

  const index = await fs.readJson<any>(indexPath);
  if (!index) {
    spinner.fail("无法读取 index.json");
    return;
  }

  const namespace = options.namespace || index.namespace;

  // 验证命名空间权限
  const userInfo = await getUserInfo();
  if (userInfo && !userInfo.namespaces.includes(namespace)) {
    spinner.fail(`你没有命名空间 @${namespace} 的发布权限`);
    logger.dim(`你的命名空间: ${userInfo.namespaces.map((n) => "@" + n).join(", ")}`);
    logger.dim("运行 npx asterhub namespace create <name> 创建新命名空间");
    return;
  }

  // 收集所有资源
  const allResources: any[] = [];

  const components = await collectResources(distDir, "components", index);
  const hooks = await collectResources(distDir, "hooks", index);
  const lib = await collectResources(distDir, "lib", index);
  const configs = await collectResources(distDir, "configs", index);

  allResources.push(...components, ...hooks, ...lib, ...configs);

  if (allResources.length === 0) {
    spinner.fail("没有找到可发布的资源");
    return;
  }

  spinner.succeed(`读取完成: ${allResources.length} 个资源`);

  logger.dim(`  UI 组件:   ${components.length}`);
  logger.dim(`  Hooks:     ${hooks.length}`);
  logger.dim(`  工具函数:  ${lib.length}`);
  logger.dim(`  配置:      ${configs.length}`);

  // 计算总大小
  const totalSize = JSON.stringify(allResources).length;
  logger.dim(`  总大小:    ${(totalSize / 1024).toFixed(2)} KB`);

  // 检查大小限制
  if (totalSize > MAX_PUBLISH_SIZE) {
    logger.error("总大小超过 5MB 限制");
    return;
  }

  // Dry run 模式
  if (options.dryRun) {
    logger.warn("[Dry Run] 以下资源将被发布:");
    logger.newline();
    for (const r of allResources) {
      const typeLabel =
        r.type === "components" ? "" : r.type === "hooks" ? "hook:" : r.type === "lib" ? "lib:" : "config:";
      logger.dim(`  @${namespace}/${typeLabel}${r.name}@${r.version}`);
    }
    logger.newline();
    return;
  }

  // 上传到服务器
  spinner.start("发布中...");

  try {
    const result = await publishResources({
      namespace,
      index,
      resources: allResources,
    });

    if (!result.success) {
      spinner.fail("发布失败");
      if (result.errors) {
        result.errors.forEach((e) => logger.error(`  ${e.name}: ${e.error}`));
      }
      return;
    }

    spinner.succeed("发布成功!");

    logger.newline();
    logger.success(`已发布到 @${namespace}`);
    logger.newline();
    logger.dim("用户可以通过以下命令安装:");
    logger.newline();

    for (const r of components) {
      logger.log(`  npx asterhub add @${namespace}/${r.name}`);
    }
    for (const r of hooks) {
      logger.log(`  npx asterhub add @${namespace}/hook:${r.name}`);
    }
    for (const r of lib) {
      logger.log(`  npx asterhub add @${namespace}/lib:${r.name}`);
    }
    for (const r of configs) {
      logger.log(`  npx asterhub add @${namespace}/config:${r.name}`);
    }

    logger.newline();
  } catch (error) {
    spinner.fail("发布失败");
    logger.error((error as Error).message);
  }
}
