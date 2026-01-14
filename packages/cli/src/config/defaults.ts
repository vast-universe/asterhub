/**
 * 默认配置
 */
import type { Framework, Style } from "../types";

// 默认框架
export const DEFAULT_FRAMEWORK: Framework = "next";

// 默认样式
export const DEFAULT_STYLE: Style = "tailwind";

// 默认官方命名空间
export const DEFAULT_NAMESPACE = "asterhub";

// 默认路径别名
export const DEFAULT_ALIASES = {
  components: "@/components",
  hooks: "@/hooks",
  lib: "@/lib",
} as const;

// 支持的框架
export const SUPPORTED_FRAMEWORKS: Framework[] = ["next"];

// 支持的样式
export const SUPPORTED_STYLES: Record<Framework, Style[]> = {
  next: ["tailwind"],
  expo: ["nativewind", "stylesheet"],
  nuxt: ["tailwind"],
};

// 资源类型
export const RESOURCE_TYPES = ["ui", "hook", "lib", "config"] as const;
