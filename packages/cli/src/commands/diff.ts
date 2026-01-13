/**
 * diff 命令 - 检查资源更新
 */
import ora from "ora";
import { logger, hasConfig, getInstalledResources } from "../lib";
import { getResource } from "../services/registry";
import semver from "semver";

export async function diff(item?: string): Promise<void> {
  if (!(await hasConfig())) {
    logger.error("请先运行 asterhub init 初始化项目");
    return;
  }

  const installed = await getInstalledResources();
  if (installed.length === 0) {
    logger.info("没有已安装的资源");
    return;
  }

  const toCheck = item
    ? installed.filter((r) => r.name === item)
    : installed;

  if (toCheck.length === 0) {
    logger.info(`未找到资源: ${item}`);
    return;
  }

  const spinner = ora("正在检查更新...").start();
  const updates: Array<{ name: string; current: string; latest: string }> = [];

  for (const r of toCheck) {
    try {
      const latest = await getResource(r.namespace, r.type, r.name);
      if (semver.gt(latest.version, r.version)) {
        updates.push({
          name: r.name,
          current: r.version,
          latest: latest.version,
        });
      }
    } catch {
      // 忽略获取失败的资源
    }
  }

  spinner.stop();

  if (updates.length === 0) {
    logger.success("所有资源都是最新版本");
    return;
  }

  logger.log("\n可用更新:\n");
  for (const u of updates) {
    logger.log(`  ${u.name}: ${u.current} -> ${u.latest}`);
  }
  logger.break();
  logger.info(`运行 asterhub update 更新资源`);
}
