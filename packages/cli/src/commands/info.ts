/**
 * info 命令 - 显示配置信息
 */
import { logger, hasConfig, readConfig, getInstalledResources } from "../lib";

export async function info(): Promise<void> {
  if (!(await hasConfig())) {
    logger.error("请先运行 asterhub init 初始化项目");
    return;
  }

  const config = await readConfig();
  if (!config) return;

  const installed = await getInstalledResources();

  logger.log("\nAsterHub 配置信息:\n");
  logger.log(`  框架: ${config.framework}`);
  logger.log(`  样式: ${config.style}`);
  logger.break();
  logger.log("  路径别名:");
  logger.log(`    components: ${config.aliases.components}`);
  logger.log(`    hooks: ${config.aliases.hooks}`);
  logger.log(`    lib: ${config.aliases.lib}`);
  logger.break();
  logger.log(`  已安装资源: ${installed.length} 个`);

  const counts = {
    ui: installed.filter((r) => r.type === "ui").length,
    hook: installed.filter((r) => r.type === "hook").length,
    lib: installed.filter((r) => r.type === "lib").length,
    config: installed.filter((r) => r.type === "config").length,
  };

  if (counts.ui) logger.log(`    - UI 组件: ${counts.ui}`);
  if (counts.hook) logger.log(`    - Hooks: ${counts.hook}`);
  if (counts.lib) logger.log(`    - 工具函数: ${counts.lib}`);
  if (counts.config) logger.log(`    - 配置: ${counts.config}`);
}
