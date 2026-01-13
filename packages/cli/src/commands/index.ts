/**
 * Commands 模块统一导出
 */

// 项目命令
// export { create } from "./create";  // TODO: v2
export { init } from "./init";

// 组件命令
export { add } from "./add";
export { remove } from "./remove";
export { update } from "./update";
export { list } from "./list";
export { search } from "./search";
export { diff } from "./diff";
export { info } from "./info";
export { view } from "./view";

// 认证命令
export { login, logout, whoami } from "./auth";

// Token 命令
export { tokenList, tokenCreate, tokenRevoke } from "./token";

// 命名空间命令
export { namespaceCreate, namespaceList, namespaceDelete } from "./namespace";

// Registry 命令
export { registryCreate, registryBuild, registryPublish } from "./registry";

// 恢复命令
export { recover } from "./recover";
