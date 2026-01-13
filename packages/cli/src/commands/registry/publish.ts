/**
 * registry publish 命令 - 发布 Registry
 */
import ora from "ora";
import { glob } from "glob";
import { logger, exists, readJson, isAuthenticated, join } from "../../lib";
import { publishResource } from "../../services/registry";
import type { RegistryResource } from "../../types";

interface PublishOptions {
  namespace?: string;
  dryRun?: boolean;
}

export async function registryPublish(options: PublishOptions): Promise<void> {
  if (!options.dryRun && !(await isAuthenticated())) {
    logger.error("请先登录");
    return;
  }

  const distDir = join(process.cwd(), "dist");

  if (!(await exists(distDir))) {
    logger.error("未找到 dist 目录，请先运行 asterhub registry build");
    return;
  }

  const spinner = ora("正在扫描资源...").start();

  try {
    // 查找所有 latest.json
    const files = await glob("**/latest.json", { cwd: distDir });

    if (files.length === 0) {
      spinner.fail("没有找到可发布的资源");
      return;
    }

    spinner.text = `找到 ${files.length} 个资源`;

    const resources: RegistryResource[] = [];

    for (const file of files) {
      const resource = await readJson<RegistryResource>(join(distDir, file));
      if (resource) {
        resources.push(resource);
      }
    }

    if (options.dryRun) {
      spinner.stop();
      logger.log("\n预览发布 (dry-run):\n");
      for (const r of resources) {
        logger.log(`  ${r.type}:${r.name}@${r.version} (${r.namespace})`);
      }
      return;
    }

    // 发布
    let published = 0;
    let failed = 0;

    for (const resource of resources) {
      spinner.text = `发布 ${resource.name}...`;
      try {
        await publishResource(resource);
        published++;
      } catch (error) {
        logger.error(`发布 ${resource.name} 失败: ${error instanceof Error ? error.message : "未知错误"}`);
        failed++;
      }
    }

    if (failed === 0) {
      spinner.succeed(`成功发布 ${published} 个资源`);
    } else {
      spinner.warn(`发布完成: ${published} 成功, ${failed} 失败`);
    }
  } catch (error) {
    spinner.fail(`发布失败: ${error instanceof Error ? error.message : "未知错误"}`);
  }
}
