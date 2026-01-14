/**
 * list 命令 - 列出可用/已安装的资源
 */
import ora from "ora";
import { logger, readConfig, getInstalledResources } from "../lib";
import { fetchAllResources } from "../services";
import type { ResourceType, Framework, Style, ListOptions } from "../types";

export async function list(options: ListOptions = {}): Promise<void> {
  const spinner = ora();
  const cwd = process.cwd();

  // 列出已安装
  if (options.installed) {
    const installed = await getInstalledResources(cwd);

    if (installed.length === 0) {
      logger.warn("没有已安装的资源");
      logger.dim("使用 npx asterhub add <name> 安装资源");
      return;
    }

    logger.header("📦", "已安装的资源");

    const groups = {
      ui: installed.filter((i) => i.type === "ui"),
      hook: installed.filter((i) => i.type === "hook"),
      lib: installed.filter((i) => i.type === "lib"),
      config: installed.filter((i) => i.type === "config"),
    };

    for (const [type, items] of Object.entries(groups)) {
      if (items.length === 0) continue;

      const label = type === "ui" ? "UI 组件" : type === "hook" ? "Hooks" : type === "lib" ? "工具函数" : "配置";
      logger.info(label + ":");

      for (const item of items) {
        const date = new Date(item.installedAt).toLocaleDateString();
        logger.log(`  ${item.name} @${item.namespace} v${item.version} (${date})`);
      }
      logger.newline();
    }

    return;
  }

  // 获取配置
  const config = await readConfig(cwd);
  const framework = (config?.framework || "next") as Framework;
  const style = (config?.style || "tailwind") as Style;

  // 确定类型
  let type: ResourceType | undefined;
  if (options.configs) type = "config";
  else if (options.hooks) type = "hook";
  else if (options.lib) type = "lib";

  spinner.start("获取资源列表...");

  try {
    const { items, total } = await fetchAllResources({
      type,
      framework,
      style,
      limit: 100,
    });

    spinner.stop();

    if (items.length === 0) {
      logger.warn("没有找到可用资源");
      return;
    }

    logger.header("📦", `可用资源 (${total} 个)`);

    const groups = {
      ui: items.filter((i) => i.type === "ui"),
      hook: items.filter((i) => i.type === "hook"),
      lib: items.filter((i) => i.type === "lib"),
      config: items.filter((i) => i.type === "config"),
    };

    for (const [t, list] of Object.entries(groups)) {
      if (list.length === 0 || (type && type !== t)) continue;

      const label = t === "ui" ? "UI 组件" : t === "hook" ? "Hooks" : t === "lib" ? "工具函数" : "配置";
      logger.info(label + ":");

      for (const item of list) {
        const ns = item.namespace === "asterhub" ? "" : `@${item.namespace}/`;
        const prefix = t === "ui" ? "" : `${t}:`;
        logger.log(`  ${ns}${prefix}${item.name} - ${item.description || ""} ↓${item.downloads}`);
      }
      logger.newline();
    }

    logger.dim("运行 npx asterhub add <name> 安装资源");
  } catch (error) {
    spinner.fail("获取列表失败");
    logger.error((error as Error).message);
  }
}
