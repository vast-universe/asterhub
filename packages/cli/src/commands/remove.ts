/**
 * remove 命令 - 删除已安装的资源
 */
import path from "path";
import ora from "ora";
import prompts from "prompts";
import { logger, fs, readConfig, markRemoved, getInstalledResources } from "../lib";
import type { ResourceType, RemoveOptions } from "../types";

export async function remove(items: string[], options: RemoveOptions = {}): Promise<void> {
  const spinner = ora();
  const cwd = process.cwd();

  try {
    // 获取已安装的资源
    const installed = await getInstalledResources(cwd);

    if (installed.length === 0) {
      logger.warn("没有已安装的资源");
      return;
    }

    // 如果没有指定，交互式选择
    if (items.length === 0) {
      const choices = installed.map((item) => {
        const typePrefix =
          item.type === "ui"
            ? ""
            : item.type === "hook"
              ? "hook:"
              : item.type === "lib"
                ? "lib:"
                : "config:";
        return {
          title: `${typePrefix}${item.name} (v${item.version})`,
          value: `${item.type}:${item.name}`,
        };
      });

      const answer = await prompts({
        type: "multiselect",
        name: "items",
        message: "选择要删除的资源:",
        choices,
        min: 1,
      });

      if (!answer.items || answer.items.length === 0) {
        logger.dim("\n已取消");
        return;
      }

      items = answer.items;
    }

    // 解析要删除的资源
    const toRemove: Array<{ type: ResourceType; name: string }> = [];

    for (const item of items) {
      let type: ResourceType = "ui";
      let name = item;

      if (item.includes(":")) {
        const [t, n] = item.split(":");
        type = t as ResourceType;
        name = n;
      }

      // 检查是否已安装
      const found = installed.find((i) => i.type === type && i.name === name);
      if (!found) {
        logger.warn(`${item} 未安装`);
        continue;
      }

      toRemove.push({ type, name });
    }

    if (toRemove.length === 0) {
      logger.warn("没有可删除的资源");
      return;
    }

    // 确认删除
    if (!options.yes) {
      const names = toRemove.map((r) => (r.type === "ui" ? r.name : `${r.type}:${r.name}`));
      const confirm = await prompts({
        type: "confirm",
        name: "value",
        message: `确定删除 ${names.join(", ")}?`,
        initial: false,
      });

      if (!confirm.value) {
        logger.dim("\n已取消");
        return;
      }
    }

    logger.newline();

    // 读取配置获取路径
    const config = await readConfig(cwd);
    const aliases = config?.aliases || {
      components: "@/components",
      hooks: "@/hooks",
      lib: "@/lib",
    };

    // 解析别名路径 - 支持 @/ 和其他格式
    const resolveAliasPath = (alias: string): string => {
      // @/xxx -> xxx (相对于项目根目录)
      if (alias.startsWith("@/")) {
        return alias.slice(2);
      }
      // ~/xxx -> xxx
      if (alias.startsWith("~/")) {
        return alias.slice(2);
      }
      // 其他情况直接返回
      return alias;
    };

    // 执行删除
    for (const { type, name } of toRemove) {
      spinner.start(`删除 ${type === "ui" ? name : `${type}:${name}`}...`);

      try {
        // 确定基础目录
        let baseDir: string;
        if (type === "ui") {
          baseDir = resolveAliasPath(aliases.components);
        } else if (type === "hook") {
          baseDir = resolveAliasPath(aliases.hooks);
        } else if (type === "lib") {
          baseDir = resolveAliasPath(aliases.lib);
        } else {
          baseDir = ""; // config 类型需要特殊处理
        }

        // 尝试删除文件 - 按优先级尝试多种可能的路径
        if (baseDir) {
          const possiblePaths = [
            // UI 组件通常在 components/ui/ 下
            path.join(cwd, baseDir, "ui", `${name}.tsx`),
            path.join(cwd, baseDir, "ui", `${name}.ts`),
            // 直接在目录下
            path.join(cwd, baseDir, `${name}.tsx`),
            path.join(cwd, baseDir, `${name}.ts`),
            // 目录形式
            path.join(cwd, baseDir, name, "index.tsx"),
            path.join(cwd, baseDir, name, "index.ts"),
            path.join(cwd, baseDir, name),
          ];

          let deleted = false;
          for (const filePath of possiblePaths) {
            if (await fs.exists(filePath)) {
              await fs.remove(filePath);
              deleted = true;
              logger.dim(`  删除: ${path.relative(cwd, filePath)}`);
            }
          }

          // 如果是 UI 组件，也检查 ui/index.ts 是否需要更新
          if (type === "ui") {
            const indexPath = path.join(cwd, baseDir, "ui", "index.ts");
            if (await fs.exists(indexPath)) {
              // 读取并移除相关导出
              const content = await fs.readText(indexPath);
              if (content) {
                const lines = content.split("\n").filter((line: string) => 
                  !line.includes(`from "./${name}"`) && 
                  !line.includes(`from './${name}'`)
                );
                await fs.writeText(indexPath, lines.join("\n"));
              }
            }
          }

          if (!deleted) {
            logger.dim(`  未找到文件，可能已被手动删除`);
          }
        }

        // 更新 asterhub.json
        await markRemoved(type, name, cwd);

        spinner.succeed(`已删除 ${type === "ui" ? name : `${type}:${name}`}`);
      } catch (error) {
        spinner.fail(`删除 ${name} 失败: ${(error as Error).message}`);
      }
    }

    logger.newline();
    logger.success("完成");
    logger.dim("提示: npm 依赖需要手动清理，运行 npm prune");
  } catch (error) {
    spinner.fail();
    logger.error((error as Error).message);
    process.exit(1);
  }
}
