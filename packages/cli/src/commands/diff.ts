/**
 * diff 命令 - 检查资源更新
 */
import ora from "ora";
import { logger, readConfig, getInstalledResources } from "../lib";
import { fetchResource, fetchResourceVersions } from "../services";
import type { ResourceRef, Framework, Style } from "../types";

export async function diff(item?: string): Promise<void> {
  const spinner = ora();
  const cwd = process.cwd();

  const config = await readConfig(cwd);
  if (!config) {
    logger.error("找不到 asterhub.json，请先运行 npx asterhub init");
    return;
  }

  const framework = config.framework as Framework;
  const style = config.style as Style;

  // 获取已安装的资源
  const installed = await getInstalledResources(cwd);

  if (installed.length === 0) {
    logger.warn("没有已安装的资源");
    return;
  }

  // 如果指定了资源，只检查该资源
  if (item) {
    await diffSingleResource(item, installed, framework, style, spinner);
    return;
  }

  // 检查所有资源
  logger.header("🔍", "检查资源更新");

  spinner.start("检查更新...");

  const updates: Array<{ name: string; type: string; current: string; latest: string }> = [];

  for (const res of installed) {
    try {
      const ref: ResourceRef = {
        namespace: res.namespace,
        type: res.type as any,
        name: res.name,
      };

      const { versions } = await fetchResourceVersions(ref);
      const latestVersion = versions[0]?.version;

      if (latestVersion && latestVersion !== res.version) {
        updates.push({
          name: res.name,
          type: res.type,
          current: res.version,
          latest: latestVersion,
        });
      }
    } catch {
      // 忽略获取失败的资源
    }
  }

  spinner.stop();

  if (updates.length === 0) {
    logger.success("所有资源都是最新的");
    return;
  }

  logger.warn(`${updates.length} 个资源有更新:`);
  logger.newline();

  for (const u of updates) {
    const prefix = u.type === "ui" ? "" : `${u.type}:`;
    logger.log(`  ${prefix}${u.name}: ${u.current} → ${u.latest}`);
  }

  logger.newline();
  logger.dim("运行 npx asterhub update 更新资源");
  logger.newline();
}

async function diffSingleResource(
  item: string,
  installed: Awaited<ReturnType<typeof getInstalledResources>>,
  framework: Framework,
  style: Style,
  spinner: ReturnType<typeof ora>
): Promise<void> {
  // 解析资源名称
  let type = "ui";
  let name = item;

  if (item.includes(":")) {
    const [t, n] = item.split(":");
    type = t;
    name = n;
  }

  // 查找已安装的资源
  const res = installed.find((i) => i.type === type && i.name === name);
  if (!res) {
    logger.warn(`资源 ${item} 未安装`);
    return;
  }

  logger.header("🔍", `检查 ${item} 更新`);

  spinner.start("获取远程版本...");

  try {
    const ref: ResourceRef = {
      namespace: res.namespace,
      type: res.type as any,
      name: res.name,
    };

    const { versions } = await fetchResourceVersions(ref);
    const latestVersion = versions[0]?.version;

    spinner.stop();

    if (!latestVersion || latestVersion === res.version) {
      logger.success(`${item} 已是最新版本 (${res.version})`);
      return;
    }

    logger.warn(`${item} 有更新: ${res.version} → ${latestVersion}`);
    logger.newline();

    // 获取远程内容进行对比
    spinner.start("获取远程内容...");

    const remoteContent = await fetchResource(ref, framework, style);

    spinner.stop();

    logger.dim("版本变更:");
    logger.dim(`  当前: ${res.version}`);
    logger.dim(`  最新: ${latestVersion}`);
    logger.newline();

    if (remoteContent.files?.length) {
      logger.dim("文件:");
      for (const file of remoteContent.files) {
        logger.dim(`  ${file.path}`);
      }
    }

    logger.newline();
    logger.dim(`运行 npx asterhub update ${item} 更新`);
    logger.newline();
  } catch (error) {
    spinner.fail("获取远程版本失败");
    logger.error((error as Error).message);
  }
}
