/**
 * 命令导出
 */
export { create } from "./create";
export { init } from "./init";
export { add } from "./add";
export { remove } from "./remove";
export { update } from "./update";
export { list } from "./list";
export { search } from "./search";
export { diff } from "./diff";
export { view } from "./view";
export { info } from "./info";
export { recover } from "./recover";

// 认证
export { login, logout, whoami } from "./auth";

// Token
export { tokenList, tokenCreate, tokenRevoke } from "./token";

// 命名空间
export { namespaceCreate, namespaceList, namespaceDelete } from "./namespace";

// Registry
export { registryCreate, registryBuild, registryPublish } from "./registry";
