/**
 * info 命令 - 显示配置信息
 */
import { logger, fs, readConfig, hasConfig, getInstalledResources } from "../lib";

export async function info(): Promise<void> {
  const cwd = process.cwd();

  logger.header("📋", "AsterHub 配置信息");

  // 检查配置文件
  if (!(await hasConfig(cwd))) {
    logger.warn("未初始化");
    logger.dim("运行 npx asterhub init 初始化项目");
    return;
  }

  const config = await readConfig(cwd);
  if (!config) {
    logger.error("无法读取配置文件");
    return;
  }

  logger.item("配置文件", "asterhub.json");
  logger.item("框架", config.framework);
  logger.item("样式方案", config.style);

  logger.newline();
  logger.info("路径配置:");
  logger.item("  组件", config.aliases.components);
  logger.item("  Hooks", config.aliases.hooks);
  logger.item("  工具", config.aliases.lib);

  // 检查目录是否存在
  const componentsDir = config.aliases.components.replace("@/", "src/");
  const hooksDir = config.aliases.hooks.replace("@/", "src/");
  const libDir = config.aliases.lib.replace("@/", "src/");

  logger.newline();
  logger.info("目录状态:");

  const dirs = [
    { name: componentsDir, label: "组件" },
    { name: hooksDir, label: "Hooks" },
    { name: libDir, label: "工具" },
  ];

  for (const dir of dirs) {
    const exists = await fs.exists(fs.join(cwd, dir.name));
    logger.log(`  ${dir.name}: ${exists ? "✔ 存在" : "未创建"}`);
  }

  // 统计已安装资源
  const installed = await getInstalledResources(cwd);

  logger.newline();
  logger.info("已安装资源:");

  const counts = {
    ui: installed.filter((i) => i.type === "ui").length,
    hook: installed.filter((i) => i.type === "hook").length,
    lib: installed.filter((i) => i.type === "lib").length,
    config: installed.filter((i) => i.type === "config").length,
  };

  logger.log(`  UI 组件: ${counts.ui}`);
  logger.log(`  Hooks: ${counts.hook}`);
  logger.log(`  工具函数: ${counts.lib}`);
  logger.log(`  配置: ${counts.config}`);

  logger.newline();
}
