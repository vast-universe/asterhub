/**
 * view 命令 - 预览资源代码
 */
import ora from "ora";
import { logger } from "../lib";
import { parseResourceId } from "../core/resolver";
import { getResource } from "../services/registry";

interface ViewOptions {
  file?: string;
}

export async function view(item: string, options: ViewOptions): Promise<void> {
  const parsed = parseResourceId(item);
  const spinner = ora(`正在获取 ${item}...`).start();

  try {
    const resource = await getResource(
      parsed.namespace,
      parsed.type,
      parsed.name,
      parsed.version
    );

    spinner.stop();

    if (options.file) {
      const file = resource.files.find((f) => f.path.includes(options.file!));
      if (!file) {
        logger.error(`未找到文件: ${options.file}`);
        return;
      }
      logger.log(`\n// ${file.path}\n`);
      logger.log(file.content);
    } else {
      logger.log(`\n${resource.name}@${resource.version}`);
      if (resource.description) {
        logger.log(resource.description);
      }
      logger.break();
      logger.log("文件:");
      for (const file of resource.files) {
        logger.log(`  - ${file.path}`);
      }
      if (resource.dependencies?.length) {
        logger.break();
        logger.log("依赖:");
        for (const dep of resource.dependencies) {
          logger.log(`  - ${dep}`);
        }
      }
      logger.break();
      logger.info(`使用 asterhub view ${item} -f <file> 查看具体文件`);
    }
  } catch (error) {
    spinner.fail(`获取失败: ${error instanceof Error ? error.message : "未知错误"}`);
  }
}
