/**
 * search 命令 - 搜索资源
 */
import ora from "ora";
import prompts from "prompts";
import { logger, readConfig } from "../lib";
import { searchResources } from "../services";
import type { ResourceType, Framework, SearchOptions } from "../types";

export async function search(query?: string, options: SearchOptions = {}): Promise<void> {
  const spinner = ora();
  const cwd = process.cwd();

  // 交互式输入
  if (!query) {
    const answer = await prompts({
      type: "text",
      name: "query",
      message: "搜索关键词:",
    });
    query = answer.query;
  }

  if (!query) {
    logger.warn("已取消");
    return;
  }

  const config = await readConfig(cwd);
  const framework = (config?.framework || "next") as Framework;

  spinner.start(`搜索 "${query}"...`);

  try {
    const { items, total } = await searchResources(query, {
      type: options.type as ResourceType,
      namespace: options.namespace,
      framework,
      limit: 50,
    });

    spinner.stop();

    if (items.length === 0) {
      logger.warn(`没有找到匹配 "${query}" 的资源`);
      return;
    }

    logger.header("🔍", `搜索结果 "${query}" (${total} 个)`);

    const groups = {
      ui: items.filter((i) => i.type === "ui"),
      hook: items.filter((i) => i.type === "hook"),
      lib: items.filter((i) => i.type === "lib"),
      config: items.filter((i) => i.type === "config"),
    };

    for (const [type, list] of Object.entries(groups)) {
      if (list.length === 0) continue;

      const label = type === "ui" ? "UI 组件" : type === "hook" ? "Hooks" : type === "lib" ? "工具函数" : "配置";
      logger.info(label + ":");

      for (const item of list) {
        const ns = item.namespace === "aster" ? "" : `@${item.namespace}/`;
        const prefix = type === "ui" ? "" : `${type}:`;
        logger.log(`  ${(ns + prefix + item.name).padEnd(30)} ${item.description || ""} ↓${item.downloads}`);
      }
      logger.newline();
    }

    logger.dim("安装: npx asterhub add <name>");
  } catch (error) {
    spinner.fail("搜索失败");
    logger.error((error as Error).message);
  }
}
