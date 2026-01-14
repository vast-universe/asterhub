/**
 * view 命令 - 预览资源代码
 */
import ora from "ora";
import { logger, readConfig } from "../lib";
import { fetchResource } from "../services";
import type { ResourceRef, Framework, Style, ViewOptions } from "../types";

/**
 * 解析资源引用
 */
function parseInput(input: string): ResourceRef | null {
  // @namespace/type:name@version 或 @namespace/name@version
  if (input.startsWith("@")) {
    const match = input.match(
      /^@([a-z0-9_-]+)\/((?:hook|lib|config):)?([a-z0-9_-]+)(?:@(.+))?$/i
    );
    if (!match) return null;

    const [, namespace, typePrefix, name, version] = match;
    let type: ResourceRef["type"] = "ui";
    if (typePrefix) {
      const t = typePrefix.replace(":", "");
      type = t === "hook" ? "hook" : t === "lib" ? "lib" : t === "config" ? "config" : "ui";
    }

    return { namespace, type, name, version };
  }

  // 简写格式: type:name 或 name (默认官方)
  let type: ResourceRef["type"] = "ui";
  let name = input;

  if (input.startsWith("config:")) {
    type = "config";
    name = input.slice(7);
  } else if (input.startsWith("hook:")) {
    type = "hook";
    name = input.slice(5);
  } else if (input.startsWith("lib:")) {
    type = "lib";
    name = input.slice(4);
  }

  return { namespace: "asterhub", type, name };
}

export async function view(item: string, options: ViewOptions = {}): Promise<void> {
  const spinner = ora();
  const cwd = process.cwd();

  if (!item) {
    logger.error("请指定要查看的资源");
    logger.dim("用法: npx asterhub view <resource>");
    logger.dim("示例: npx asterhub view button");
    logger.dim("      npx asterhub view @zhangsan/fancy-button");
    return;
  }

  // 解析资源引用
  const ref = parseInput(item);
  if (!ref) {
    logger.error(`无效的资源引用: ${item}`);
    return;
  }

  // 读取配置获取 framework 和 style
  const config = await readConfig(cwd);
  const framework = (config?.framework || "next") as Framework;
  const style = (config?.style || "tailwind") as Style;

  const typePrefix = ref.type === "ui" ? "" : `${ref.type}:`;
  const displayName = `@${ref.namespace}/${typePrefix}${ref.name}`;

  logger.header("📄", `查看 ${displayName}`);

  spinner.start("获取资源...");

  try {
    const content = await fetchResource(ref, framework, style);
    spinner.stop();

    // 显示基本信息
    logger.newline();
    logger.log(`名称: ${content.name}`);
    logger.log(`版本: ${content.version}`);
    logger.log(`类型: ${content.type}`);
    if (content.description) {
      logger.log(`描述: ${content.description}`);
    }
    logger.newline();

    // 显示依赖
    if (content.dependencies?.length) {
      logger.dim("npm 依赖:");
      content.dependencies.forEach((d) => logger.dim(`  ${d}`));
      logger.newline();
    }

    if (content.registryDependencies?.length) {
      logger.dim("Registry 依赖:");
      content.registryDependencies.forEach((d) => logger.dim(`  ${d}`));
      logger.newline();
    }

    // 显示文件
    if (!content.files?.length) {
      logger.warn("没有文件");
      return;
    }

    logger.dim(`文件 (${content.files.length}):`);
    content.files.forEach((f, i) => {
      logger.dim(`  [${i + 1}] ${f.path}`);
    });
    logger.newline();

    // 如果指定了文件，显示该文件内容
    if (options.file) {
      const fileIndex = parseInt(options.file) - 1;
      const file = content.files[fileIndex] || content.files.find((f) => f.path.includes(options.file!));

      if (!file) {
        logger.error(`找不到文件: ${options.file}`);
        return;
      }

      logger.header("📝", file.path);
      logger.newline();
      console.log(file.content);
      logger.newline();
    } else {
      // 默认显示第一个文件
      const file = content.files[0];
      logger.header("📝", file.path);
      logger.newline();
      console.log(file.content);
      logger.newline();

      if (content.files.length > 1) {
        logger.dim(`提示: 使用 --file <n> 查看其他文件`);
        logger.newline();
      }
    }
  } catch (error) {
    spinner.fail("获取资源失败");
    logger.error((error as Error).message);
  }
}
