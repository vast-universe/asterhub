/**
 * 限制配置
 */

// 最大发布大小 (5MB)
export const MAX_PUBLISH_SIZE = 5 * 1024 * 1024;

// 单个文件最大大小 (500KB)
export const MAX_FILE_SIZE = 500 * 1024;

// 命名空间长度限制
export const NAMESPACE_MIN_LENGTH = 3;
export const NAMESPACE_MAX_LENGTH = 30;

// 组件名称长度限制
export const COMPONENT_MIN_LENGTH = 2;
export const COMPONENT_MAX_LENGTH = 64;

// 版本号正则
export const VERSION_REGEX = /^\d+\.\d+\.\d+$/;

// 命名空间正则
export const NAMESPACE_REGEX = /^[a-z][a-z0-9_-]*$/;

// 组件名称正则
export const COMPONENT_NAME_REGEX = /^[a-z][a-z0-9-]*$/;
