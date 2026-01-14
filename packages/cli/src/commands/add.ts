/**
 * add 命令 - 添加组件/hooks/lib/config
 */
import ora from "ora";
import prompts from "prompts";
import { logger, fs, readConfig, markInstalled } from "../lib";
import { fetchResource, checkSecurityAdvisories } from "../services";
import {
  DependencyResolver,
  parseResourceRef,
  getResourceKey,
  InstallTransaction,
  scanComponent,
  printSecurityReport,
} from "../core";
import type { ResourceRef, ResourceContent, Framework, Style, AddOptions } from "../types";

/**
 * 解析输入为 ResourceRef
 */
function parseInput(input: string): ResourceRef | null {
  if (input.startsWith("@")) {
    return parseResourceRef(input);
  }

  // 简写格式: type:name@version 或 name@version
  let type: ResourceRef["type"] = "ui";
  let name = input;
  let version: string | undefined;

  // 提取版本号
  if (name.includes("@")) {
    const atIndex = name.lastIndexOf("@");
    version = name.slice(atIndex + 1);
    name = name.slice(0, atIndex);
  }

  if (name.startsWith("config:")) {
    type = "config";
    name = name.slice(7);
  } else if (name.startsWith("hook:")) {
    type = "hook";
    name = name.slice(5);
  } else if (name.startsWith("lib:")) {
    type = "lib";
    name = name.slice(4);
  }

  return { namespace: "aster", type, name, version };
}

/**
 * 解析简写格式的依赖引用 (type:name 或 name)
 * 默认使用父资源的 namespace
 */
function parseShorthandRef(input: string, defaultNamespace: string): ResourceRef | null {
  // 先尝试完整格式
  if (input.startsWith("@")) {
    return parseResourceRef(input);
  }

  // 简写格式: type:name 或 name
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

  // 验证 name 格式
  if (!/^[a-z0-9_-]+$/i.test(name)) {
    return null;
  }

  return { namespace: defaultNamespace, type, name };
}

export async function add(items: string[], options: AddOptions = {}): Promise<void> {
  const spinner = ora();
  const cwd = process.cwd();

  // 1. 读取配置
  const config = await readConfig(cwd);
  if (!config) {
    logger.error("找不到 asterhub.json，请先运行 npx asterhub init");
    return;
  }

  const framework = config.framework as Framework;
  const style = config.style as Style;

  // 2. 解析资源引用
  const refs: ResourceRef[] = [];
  for (const item of items) {
    const ref = parseInput(item);
    if (!ref) {
      logger.error(`无效的资源引用: ${item}`);
      return;
    }
    refs.push(ref);
  }

  logger.header("📦", `安装 ${refs.length} 个资源`);

  // 3. 解析依赖
  spinner.start("解析依赖...");

  const resolver = new DependencyResolver(async (ref) => {
    try {
      const content = await fetchResource(ref, framework, style);
      const deps: ResourceRef[] = [];

      if (content.registryDependencies) {
        for (const dep of content.registryDependencies) {
          // 尝试完整格式 @namespace/type:name
          let depRef = parseResourceRef(dep);
          
          // 如果解析失败，尝试简写格式 type:name 或 name
          if (!depRef) {
            depRef = parseShorthandRef(dep, ref.namespace);
          }
          
          if (depRef) deps.push(depRef);
        }
      }

      return { ref, content, dependencies: deps };
    } catch {
      return null;
    }
  });

  const { resources, order, errors } = await resolver.resolve(refs);

  if (errors.length > 0) {
    spinner.fail("依赖解析失败");
    errors.forEach((e) => logger.error(`  ${e}`));
    return;
  }

  spinner.succeed(`解析完成: ${resources.length} 个资源`);

  logger.dim("\n将安装:");
  order.forEach((key) => logger.dim(`  ${key}`));
  logger.newline();

  // 4. 安全检查（社区组件）
  const communityResources = resources.filter((r) => r.ref.namespace !== "aster");

  if (communityResources.length > 0 && !options.skipSecurity) {
    spinner.start("安全检查...");

    try {
      const { advisories } = await checkSecurityAdvisories(communityResources.map((r) => r.ref));

      if (advisories.length > 0) {
        spinner.warn("发现安全公告");
        for (const adv of advisories) {
          logger.error(`\n  ⚠ ${adv.title}`);
          logger.dim(`    ${adv.description}`);
        }

        const { proceed } = await prompts({
          type: "confirm",
          name: "proceed",
          message: "是否继续安装?",
          initial: false,
        });

        if (!proceed) {
          logger.dim("\n已取消");
          return;
        }
      } else {
        spinner.succeed("安全检查通过");
      }
    } catch {
      spinner.warn("无法检查安全公告");
    }

    // 本地代码扫描
    spinner.start("扫描代码...");
    let hasHighRisk = false;

    for (const resource of communityResources) {
      const report = scanComponent(resource.content);
      if (report.highCount > 0) {
        hasHighRisk = true;
        logger.error(`\n  ${getResourceKey(resource.ref)}:`);
        printSecurityReport(report, true);
      }
    }

    if (hasHighRisk) {
      spinner.warn("发现高风险代码");

      const { proceed } = await prompts({
        type: "confirm",
        name: "proceed",
        message: "是否继续安装?",
        initial: false,
      });

      if (!proceed) {
        logger.dim("\n已取消");
        return;
      }
    } else {
      spinner.succeed("代码扫描通过");
    }
  }

  // 5. 检查文件冲突
  const conflicts: string[] = [];
  for (const resource of resources) {
    const content = resource.content as ResourceContent;
    for (const file of content.files || []) {
      if (await fs.exists(fs.resolve(cwd, file.path))) {
        conflicts.push(file.path);
      }
    }
  }

  if (conflicts.length > 0 && !options.force) {
    logger.warn("\n以下文件已存在:");
    conflicts.forEach((f) => logger.dim(`  ${f}`));

    const { overwrite } = await prompts({
      type: "confirm",
      name: "overwrite",
      message: "是否覆盖?",
      initial: false,
    });

    if (!overwrite) {
      logger.dim("\n已取消");
      return;
    }
  }

  // 6. 安装（事务）
  const transaction = new InstallTransaction(cwd);

  try {
    await transaction.begin();
    spinner.start("安装中...");

    const npmDeps: string[] = [];
    const npmDevDeps: string[] = [];

    for (const key of order) {
      const resource = resources.find((r) => getResourceKey(r.ref) === key);
      if (!resource) continue;

      const content = resource.content as ResourceContent;

      for (const file of content.files || []) {
        await transaction.writeFile(file.path, file.content);
      }

      if (content.dependencies) npmDeps.push(...content.dependencies);
      if (content.devDependencies) npmDevDeps.push(...content.devDependencies);
    }

    await transaction.commit();
    spinner.succeed(`安装完成: ${resources.length} 个资源`);

    // 更新配置
    for (const resource of resources) {
      const content = resource.content as ResourceContent;
      await markInstalled(resource.ref.type, resource.ref.name, content.version, resource.ref.namespace, undefined, cwd);
    }

    // 提示安装依赖
    const uniqueDeps = [...new Set(npmDeps)];
    const uniqueDevDeps = [...new Set(npmDevDeps)];

    if (uniqueDeps.length > 0 || uniqueDevDeps.length > 0) {
      logger.header("📦", "需要安装以下依赖:");
      if (uniqueDeps.length > 0) {
        logger.log(`  npm install ${uniqueDeps.join(" ")}`);
      }
      if (uniqueDevDeps.length > 0) {
        logger.log(`  npm install -D ${uniqueDevDeps.join(" ")}`);
      }
    }

    logger.newline();
    logger.success("完成");
  } catch (error) {
    spinner.fail("安装失败");
    logger.error((error as Error).message);
    await transaction.rollback();
  }
}
