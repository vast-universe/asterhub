/**
 * 配置相关类型
 */
import type { InstalledResource } from "./resource";

// 框架类型
export type Framework = "next" | "expo" | "nuxt";

// 样式类型
export type Style = "tailwind" | "nativewind" | "stylesheet";

// AsterHub 配置
export interface AsterHubConfig {
  $schema?: string;
  style: Style;
  framework: Framework;
  aliases: {
    components: string;
    hooks: string;
    lib: string;
  };
  installed: {
    ui: Record<string, InstalledResource>;
    hook: Record<string, InstalledResource>;
    lib: Record<string, InstalledResource>;
    config: Record<string, InstalledResource>;
  };
}
