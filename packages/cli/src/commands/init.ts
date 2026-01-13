/**
 * init 命令 - 初始化 AsterHub 配置
 */
import prompts from "prompts";
import { logger, hasConfig, ensureConfig, writeConfig } from "../lib";
import { DEFAULT_FRAMEWORK, DEFAULT_STYLE } from "../constants";
import type { AsterHubConfig } from "../types";

export async function init(): Promise<void> {
  if (await hasConfig()) {
    logger.warn("asterhub.json 已存在");
    const { overwrite } = await prompts({
      type: "confirm",
      name: "overwrite",
      message: "是否覆盖现有配置?",
      initial: false,
    });
    if (!overwrite) return;
  }

  const answers = await prompts([
    {
      type: "select",
      name: "framework",
      message: "选择框架",
      choices: [
        { title: "Expo", value: "expo" },
        { title: "React Native", value: "react-native" },
        { title: "Next.js", value: "nextjs" },
      ],
      initial: 0,
    },
    {
      type: "select",
      name: "style",
      message: "选择样式方案",
      choices: [
        { title: "NativeWind", value: "nativewind" },
        { title: "Tamagui", value: "tamagui" },
        { title: "Unistyles", value: "unistyles" },
      ],
      initial: 0,
    },
  ]);

  if (!answers.framework) return;

  const config: AsterHubConfig = {
    $schema: "https://asterhub.dev/schema/asterhub.json",
    style: answers.style || DEFAULT_STYLE,
    framework: answers.framework || DEFAULT_FRAMEWORK,
    aliases: {
      components: "@/components",
      hooks: "@/hooks",
      lib: "@/lib",
    },
    installed: {
      ui: {},
      hook: {},
      lib: {},
      config: {},
    },
  };

  await writeConfig(config);
  logger.success("已创建 asterhub.json");
}
