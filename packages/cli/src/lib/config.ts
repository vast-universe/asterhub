/**
 * 配置管理 - asterhub.json 操作
 */
import { CONFIG_FILE, DEFAULT_FRAMEWORK, DEFAULT_STYLE } from "../constants";
import { readJson, writeJson, exists, join } from "./fs";
import type { AsterHubConfig, InstalledResource, ResourceType } from "../types";

/**
 * 默认配置
 */
const DEFAULT_CONFIG: AsterHubConfig = {
  $schema: "https://asterhub.dev/schema/asterhub.json",
  style: DEFAULT_STYLE,
  framework: DEFAULT_FRAMEWORK,
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

/**
 * 获取配置文件路径
 */
function getConfigPath(cwd: string = process.cwd()): string {
  return join(cwd, CONFIG_FILE);
}

/**
 * 读取配置
 */
export async function readConfig(cwd?: string): Promise<AsterHubConfig | null> {
  return readJson<AsterHubConfig>(getConfigPath(cwd));
}

/**
 * 写入配置
 */
export async function writeConfig(config: AsterHubConfig, cwd?: string): Promise<void> {
  await writeJson(getConfigPath(cwd), config);
}

/**
 * 确保配置存在
 */
export async function ensureConfig(cwd?: string): Promise<AsterHubConfig> {
  let config = await readConfig(cwd);
  if (!config) {
    config = { ...DEFAULT_CONFIG };
    await writeConfig(config, cwd);
  }
  return config;
}

/**
 * 检查配置是否存在
 */
export async function hasConfig(cwd?: string): Promise<boolean> {
  return exists(getConfigPath(cwd));
}

/**
 * 标记资源已安装
 */
export async function markInstalled(
  type: ResourceType,
  name: string,
  version: string,
  namespace: string,
  integrity?: string,
  cwd?: string
): Promise<void> {
  const config = await ensureConfig(cwd);

  config.installed[type][name] = {
    version,
    namespace,
    installedAt: new Date().toISOString(),
    integrity,
  };

  await writeConfig(config, cwd);
}

/**
 * 标记资源已移除
 */
export async function markRemoved(type: ResourceType, name: string, cwd?: string): Promise<void> {
  const config = await readConfig(cwd);
  if (config?.installed[type][name]) {
    delete config.installed[type][name];
    await writeConfig(config, cwd);
  }
}

/**
 * 获取已安装的资源列表
 */
export async function getInstalledResources(
  cwd?: string
): Promise<
  Array<{
    type: ResourceType;
    name: string;
    version: string;
    namespace: string;
    installedAt: string;
  }>
> {
  const config = await readConfig(cwd);
  if (!config) return [];

  const resources: Array<{
    type: ResourceType;
    name: string;
    version: string;
    namespace: string;
    installedAt: string;
  }> = [];

  for (const type of ["ui", "hook", "lib", "config"] as ResourceType[]) {
    for (const [name, info] of Object.entries(config.installed[type])) {
      resources.push({
        type,
        name,
        version: info.version,
        namespace: info.namespace,
        installedAt: info.installedAt,
      });
    }
  }

  return resources;
}

/**
 * 检查资源是否已安装
 */
export async function isInstalled(
  type: ResourceType,
  name: string,
  cwd?: string
): Promise<InstalledResource | null> {
  const config = await readConfig(cwd);
  return config?.installed[type][name] || null;
}

/**
 * 获取配置值
 */
export async function getConfigValue<K extends keyof AsterHubConfig>(
  key: K,
  cwd?: string
): Promise<AsterHubConfig[K] | undefined> {
  const config = await readConfig(cwd);
  return config?.[key];
}
