/**
 * remove 命令 - 删除已安装的资源
 */
import prompts from "prompts";
import ora from "ora";
import { logger, hasConfig, getInstalledResources, markRemoved, remove as removeFile, join } from "../lib";
import { parseResourceId } from "../core/resolver";

interface RemoveOptions {
  yes?: boolean;
}

export async function remove(items: string[], options: RemoveOptions): Promise<void> {
  if (!(await hasConfig())) {
    logger.error("请先运行 asterhub init 初始化项目");
    return;
  }

  const installed = await getInstalledResources();
  if (installed.length === 0) {
    logger.info("没有已安装的资源");
    return;
  }

  let toRemove = items;

  // 如果没有指定资源，让用户选择
  if (toRemove.length === 0) {
    const { selected } = await prompts({
      type: "multiselect",
      name: "selected",
      message: "选择要删除的资源",
      choices: installed.map((r) => ({
        title: `${r.type === "ui" ? "" : r.type + ":"}${r.name} (${r.version})`,
        value: `${r.type}:${r.name}`,
      })),
    });

    if (!selected || selected.length === 0) return;
    toRemove = selected;
  }

  // 确认删除
  if (!options.yes) {
    const { confirm } = await prompts({
      type: "confirm",
      name: "confirm",
      message: `确定要删除 ${toRemove.length} 个资源吗?`,
      initial: false,
    });
    if (!confirm) return;
  }

  const spinner = ora();

  for (const item of toRemove) {
    const parsed = parseResourceId(item);
    spinner.start(`正在删除 ${parsed.name}...`);

    try {
      // TODO: 删除实际文件
      await markRemoved(parsed.type, parsed.name);
      spinner.succeed(`已删除 ${parsed.name}`);
    } catch (error) {
      spinner.fail(`删除 ${parsed.name} 失败: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  }
}
