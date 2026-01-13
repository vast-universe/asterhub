/**
 * update 命令 - 更新已安装的资源
 */
import ora from "ora";
import prompts from "prompts";
import { logger, readConfig, markInstalled, getInstalledResources } from "../lib";
import { fetchResource, fetchResourceVersions } from "../services";
import { InstallTransaction } from "../core";
import type { ResourceRef, Framework, Style, UpdateOptions, UpdateInfo } from "../types";

export async function update(items: string[], options: UpdateOptions = {}): Promise<void> {
  const spinner = ora();
  const cwd = process.cwd();

  try {
    // 获取配置
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

    // 确定要检查的资源
    let toCheck = installed;
    if (!options.all && items.length > 0) {
      toCheck = installed.filter((i) => {
        const key = i.type === "ui" ? i.name : `${i.type}:${i.name}`;
        return items.includes(key) || items.includes(i.name);
      });

      if (toCheck.length === 0) {
        logger.warn("指定的资源未安装");
        return;
      }
    }

    logger.dim(`\n检查 ${toCheck.length} 个资源的更新...\n`);

    // 检查更新
    spinner.start("检查更新...");
    const updates: UpdateInfo[] = [];

    for (const item of toCheck) {
      try {
        const ref: ResourceRef = {
          namespace: item.namespace,
          type: item.type as any,
          name: item.name,
        };

        const { versions } = await fetchResourceVersions(ref);
        const latestVersion = versions[0]?.version || item.version;

        updates.push({
          type: item.type,
          name: item.name,
          namespace: item.namespace,
          currentVersion: item.version,
          latestVersion,
          hasUpdate: latestVersion !== item.version,
        });
      } catch {
        // 获取失败，跳过
        updates.push({
          type: item.type,
          name: item.name,
          namespace: item.namespace,
          currentVersion: item.version,
          latestVersion: item.version,
          hasUpdate: false,
        });
      }
    }

    spinner.stop();

    // 显示结果
    const withUpdates = updates.filter((u) => u.hasUpdate);
    const upToDate = updates.filter((u) => !u.hasUpdate);

    if (withUpdates.length === 0) {
      logger.success("所有资源都是最新的");
      return;
    }

    logger.header("📦", "有更新的资源:");
    for (const u of withUpdates) {
      const key = u.type === "ui" ? u.name : `${u.type}:${u.name}`;
      logger.log(`  ● ${key} ${u.currentVersion} → ${u.latestVersion}`);
    }

    if (upToDate.length > 0) {
      logger.dim(`\n已是最新: ${upToDate.length} 个`);
    }

    // 确认更新
    let toUpdate: UpdateInfo[];
    if (!options.force) {
      const answer = await prompts({
        type: "multiselect",
        name: "selected",
        message: "选择要更新的资源:",
        choices: withUpdates.map((u) => {
          const key = u.type === "ui" ? u.name : `${u.type}:${u.name}`;
          return {
            title: `${key} (${u.currentVersion} → ${u.latestVersion})`,
            value: u,
            selected: true,
          };
        }),
      });

      if (!answer.selected || answer.selected.length === 0) {
        logger.dim("\n已取消");
        return;
      }

      toUpdate = answer.selected;
    } else {
      toUpdate = withUpdates;
    }

    logger.newline();

    // 执行更新（使用事务）
    const transaction = new InstallTransaction(cwd);

    try {
      await transaction.begin();

      for (const u of toUpdate) {
        const key = u.type === "ui" ? u.name : `${u.type}:${u.name}`;
        spinner.start(`更新 ${key}...`);

        const ref: ResourceRef = {
          namespace: u.namespace,
          type: u.type as any,
          name: u.name,
          version: u.latestVersion,
        };

        const content = await fetchResource(ref, framework, style);

        // 写入文件
        for (const file of content.files || []) {
          await transaction.writeFile(file.path, file.content);
        }

        // 更新记录
        await markInstalled(u.type as any, u.name, u.latestVersion, u.namespace, undefined, cwd);

        spinner.succeed(`已更新 ${key} → ${u.latestVersion}`);
      }

      await transaction.commit();
      logger.newline();
      logger.success("完成");
    } catch (error) {
      spinner.fail("更新失败");
      logger.error((error as Error).message);
      await transaction.rollback();
    }
  } catch (error) {
    spinner.fail();
    logger.error((error as Error).message);
    process.exit(1);
  }
}
