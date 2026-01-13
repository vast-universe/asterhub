/**
 * list 命令 - 列出可用/已安装的资源
 */
import { logger, hasConfig, getInstalledResources } from "../lib";
import { searchResources } from "../services/registry";

interface ListOptions {
  installed?: boolean;
  configs?: boolean;
  hooks?: boolean;
  lib?: boolean;
}

export async function list(options: ListOptions): Promise<void> {
  if (options.installed) {
    await listInstalled(options);
  } else {
    await listAvailable(options);
  }
}

async function listInstalled(options: ListOptions): Promise<void> {
  if (!(await hasConfig())) {
    logger.error("请先运行 asterhub init 初始化项目");
    return;
  }

  const installed = await getInstalledResources();
  if (installed.length === 0) {
    logger.info("没有已安装的资源");
    return;
  }

  // 过滤类型
  let filtered = installed;
  if (options.configs) {
    filtered = installed.filter((r) => r.type === "config");
  } else if (options.hooks) {
    filtered = installed.filter((r) => r.type === "hook");
  } else if (options.lib) {
    filtered = installed.filter((r) => r.type === "lib");
  }

  logger.log("\n已安装的资源:\n");

  const grouped = {
    ui: filtered.filter((r) => r.type === "ui"),
    hook: filtered.filter((r) => r.type === "hook"),
    lib: filtered.filter((r) => r.type === "lib"),
    config: filtered.filter((r) => r.type === "config"),
  };

  for (const [type, resources] of Object.entries(grouped)) {
    if (resources.length === 0) continue;

    const typeLabel = {
      ui: "UI 组件",
      hook: "Hooks",
      lib: "工具函数",
      config: "配置",
    }[type];

    logger.log(`${typeLabel}:`);
    for (const r of resources) {
      const ns = r.namespace !== "official" ? `@${r.namespace}/` : "";
      logger.log(`  - ${ns}${r.name} (${r.version})`);
    }
    logger.break();
  }
}

async function listAvailable(options: ListOptions): Promise<void> {
  try {
    let type: string | undefined;
    if (options.configs) type = "config";
    else if (options.hooks) type = "hook";
    else if (options.lib) type = "lib";

    const resources = await searchResources("", { type });

    if (resources.length === 0) {
      logger.info("没有可用的资源");
      return;
    }

    logger.log("\n可用资源:\n");

    for (const r of resources) {
      const ns = r.namespace !== "official" ? `@${r.namespace}/` : "";
      const prefix = r.type !== "ui" ? `${r.type}:` : "";
      logger.log(`  ${prefix}${ns}${r.name} - ${r.description || ""}`);
    }
  } catch (error) {
    logger.error(`获取资源列表失败: ${error instanceof Error ? error.message : "未知错误"}`);
  }
}
