/**
 * 配置相关类型
 */
import type { Framework, Style } from "./common";
import type { InstalledResource } from "./resource";

// AsterHub 项目配置 (asterhub.json)
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
