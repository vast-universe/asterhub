/**
 * init 命令 - 初始化 AsterHub 配置
 */
import prompts from "prompts";
import { logger, fs, hasConfig, writeConfig } from "../lib";
import type { AsterHubConfig, Style, Framework } from "../types";

export async function init(): Promise<void> {
  const cwd = process.cwd();

  logger.header("🚀", "初始化 AsterHub");

  // 检查是否已存在配置
  if (await hasConfig(cwd)) {
    const { overwrite } = await prompts({
      type: "confirm",
      name: "overwrite",
      message: "asterhub.json 已存在，是否覆盖？",
      initial: false,
    });

    if (!overwrite) {
      logger.warn("已取消");
      return;
    }
  }

  // 选择框架
  const { framework } = await prompts({
    type: "select",
    name: "framework",
    message: "选择框架:",
    choices: [
      { title: "Next.js", value: "next" },
      { title: "Nuxt (即将支持)", value: "nuxt", disabled: true },
    ],
    initial: 0,
  });

  if (!framework) {
    logger.warn("已取消");
    return;
  }

  // 选择样式方案
  const { style } = await prompts({
    type: "select",
    name: "style",
    message: "选择样式方案:",
    choices: [
      { title: "Tailwind CSS", value: "tailwind" },
      { title: "CSS Modules (即将支持)", value: "css-modules", disabled: true },
    ],
    initial: 0,
  });

  if (!style) {
    logger.warn("已取消");
    return;
  }

  // 配置路径
  const paths = await prompts([
    {
      type: "text",
      name: "components",
      message: "组件存放目录:",
      initial: "@/components",
    },
    {
      type: "text",
      name: "hooks",
      message: "Hooks 目录:",
      initial: "@/hooks",
    },
    {
      type: "text",
      name: "lib",
      message: "工具函数目录:",
      initial: "@/lib",
    },
  ]);

  if (!paths.components) {
    logger.warn("已取消");
    return;
  }

  // 创建配置
  const config: AsterHubConfig = {
    $schema: "https://asterhub.dev/schema/asterhub.json",
    framework: framework as Framework,
    style: style as Style,
    aliases: {
      components: paths.components,
      hooks: paths.hooks,
      lib: paths.lib,
    },
    installed: {
      ui: {},
      hook: {},
      lib: {},
      config: {},
    },
  };

  await writeConfig(config, cwd);

  // 创建目录
  const dirs = [
    paths.components.replace(/^[@~]\//, ""),
    paths.hooks.replace(/^[@~]\//, ""),
    paths.lib.replace(/^[@~]\//, ""),
  ];

  for (const dir of dirs) {
    await fs.ensureDir(fs.join(cwd, dir));
  }

  logger.success("创建 asterhub.json");
  logger.dim(`  框架: ${framework}`);
  logger.dim(`  样式方案: ${style}`);

  // 提示配置路径别名
  logger.newline();
  logger.warn("请确保在 tsconfig.json 中配置路径别名:");
  logger.dim(`
  {
    "compilerOptions": {
      "baseUrl": ".",
      "paths": {
        "@/*": ["./*"]
      }
    }
  }
`);

  logger.newline();
  logger.dim("运行 npx asterhub add button 添加第一个组件");
  logger.newline();
}
