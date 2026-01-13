/**
 * search 命令 - 搜索资源
 */
import ora from "ora";
import { logger } from "../lib";
import { searchResources } from "../services/registry";

interface SearchOptions {
  type?: string;
  namespace?: string;
}

export async function search(query: string = "", options: SearchOptions): Promise<void> {
  const spinner = ora("正在搜索...").start();

  try {
    const resources = await searchResources(query, {
      type: options.type,
      namespace: options.namespace,
    });

    spinner.stop();

    if (resources.length === 0) {
      logger.info("没有找到匹配的资源");
      return;
    }

    logger.log(`\n找到 ${resources.length} 个资源:\n`);

    for (const r of resources) {
      const ns = r.namespace !== "official" ? `@${r.namespace}/` : "";
      const prefix = r.type !== "ui" ? `${r.type}:` : "";
      logger.log(`  ${prefix}${ns}${r.name}@${r.latestVersion}`);
      if (r.description) {
        logger.log(`    ${r.description}`);
      }
    }
  } catch (error) {
    spinner.fail(`搜索失败: ${error instanceof Error ? error.message : "未知错误"}`);
  }
}
