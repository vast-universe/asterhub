/**
 * add 命令 - 添加组件/hooks/lib/config
 */
import ora from "ora";
import { logger, hasConfig, readConfig, markInstalled, writeFile, join } from "../lib";
import { parseResourceId } from "../core/resolver";
import { checkResourceSecurity, displaySecurityResult } from "../core/security";
import { beginTransaction, recordFile, commitTransaction, rollbackTransaction } from "../core/transaction";
import { getResource } from "../services/registry";

interface AddOptions {
  force?: boolean;
  skipSecurity?: boolean;
}

export async function add(items: string[], options: AddOptions): Promise<void> {
  if (!(await hasConfig())) {
    logger.error("请先运行 asterhub init 初始化项目");
    return;
  }

  const config = await readConfig();
  if (!config) return;

  const spinner = ora();
  let transactionId: string | undefined;

  try {
    transactionId = await beginTransaction();

    for (const item of items) {
      const parsed = parseResourceId(item);
      spinner.start(`正在获取 ${item}...`);

      try {
        const resource = await getResource(
          parsed.namespace,
          parsed.type,
          parsed.name,
          parsed.version
        );

        spinner.text = `正在安装 ${item}...`;

        // 安全检查
        if (!options.skipSecurity && parsed.namespace !== "official") {
          const securityResult = await checkResourceSecurity(resource.files);
          if (!securityResult.passed) {
            spinner.fail(`${item} 安全检查未通过`);
            displaySecurityResult(securityResult);
            continue;
          }
          if (securityResult.warnings.length > 0) {
            spinner.warn(`${item} 存在安全警告`);
            displaySecurityResult(securityResult);
          }
        }

        // 写入文件
        for (const file of resource.files) {
          const targetPath = getTargetPath(config, parsed.type, file.path);
          await recordFile(targetPath, true);
          await writeFile(targetPath, file.content);
        }

        // 标记已安装
        await markInstalled(
          parsed.type,
          parsed.name,
          resource.version,
          parsed.namespace
        );

        spinner.succeed(`已安装 ${item}`);
      } catch (error) {
        spinner.fail(`安装 ${item} 失败: ${error instanceof Error ? error.message : "未知错误"}`);
      }
    }

    await commitTransaction();
  } catch (error) {
    if (transactionId) {
      await rollbackTransaction();
    }
    logger.error(`安装失败: ${error instanceof Error ? error.message : "未知错误"}`);
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
  // 将 @/ 替换为实际路径
  const resolvedBase = baseDir.replace(/^@\//, "");
  return join(process.cwd(), resolvedBase, filePath);
}
