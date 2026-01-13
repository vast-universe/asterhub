/**
 * update 命令 - 更新已安装的资源
 */
import ora from "ora";
import { logger, hasConfig, getInstalledResources, readConfig, markInstalled, writeFile, join } from "../lib";
import { parseResourceId } from "../core/resolver";
import { getResource } from "../services/registry";

interface UpdateOptions {
  all?: boolean;
  force?: boolean;
}

export async function update(items: string[], options: UpdateOptions): Promise<void> {
  if (!(await hasConfig())) {
    logger.error("请先运行 asterhub init 初始化项目");
    return;
  }

  const config = await readConfig();
  if (!config) return;

  const installed = await getInstalledResources();
  if (installed.length === 0) {
    logger.info("没有已安装的资源");
    return;
  }

  let toUpdate = items.map((item) => parseResourceId(item));

  // 如果指定 --all，更新所有
  if (options.all || items.length === 0) {
    toUpdate = installed.map((r) => ({
      namespace: r.namespace,
      type: r.type,
      name: r.name,
    }));
  }

  const spinner = ora();

  for (const parsed of toUpdate) {
    spinner.start(`正在检查 ${parsed.name}...`);

    try {
      const resource = await getResource(
        parsed.namespace,
        parsed.type,
        parsed.name
      );

      const current = installed.find(
        (r) => r.type === parsed.type && r.name === parsed.name
      );

      if (current && current.version === resource.version && !options.force) {
        spinner.info(`${parsed.name} 已是最新版本 (${resource.version})`);
        continue;
      }

      spinner.text = `正在更新 ${parsed.name}...`;

      // 写入文件
      for (const file of resource.files) {
        const targetPath = getTargetPath(config, parsed.type, file.path);
        await writeFile(targetPath, file.content);
      }

      // 更新安装记录
      await markInstalled(
        parsed.type,
        parsed.name,
        resource.version,
        parsed.namespace
      );

      spinner.succeed(`已更新 ${parsed.name} -> ${resource.version}`);
    } catch (error) {
      spinner.fail(`更新 ${parsed.name} 失败: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  }
}

function getTargetPath(
  config: NonNullable<Awaited<ReturnType<typeof readConfig>>>,
  type: string,
  filePath: string
): string {
  const aliasMap: Record<string, string> = {
    ui: config.aliases.components,
    hook: config.aliases.hooks,
    lib: config.aliases.lib,
    config: ".",
  };

  const baseDir = aliasMap[type] || ".";
  const resolvedBase = baseDir.replace(/^@\//, "");
  return join(process.cwd(), resolvedBase, filePath);
}
