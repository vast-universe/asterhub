/**
 * 资源解析器
 */
import type { ResourceType } from "../constants";

interface ParsedResource {
  namespace: string;
  type: ResourceType;
  name: string;
  version?: string;
}

/**
 * 解析资源标识符
 * 格式: [@namespace/]type:name[@version]
 * 示例:
 *   - button -> { namespace: "official", type: "ui", name: "button" }
 *   - hook:use-debounce -> { namespace: "official", type: "hook", name: "use-debounce" }
 *   - @zhangsan/button@1.0.0 -> { namespace: "zhangsan", type: "ui", name: "button", version: "1.0.0" }
 */
export function parseResourceId(id: string): ParsedResource {
  let namespace = "official";
  let type: ResourceType = "ui";
  let name = id;
  let version: string | undefined;

  // 解析命名空间
  if (name.startsWith("@")) {
    const slashIndex = name.indexOf("/");
    if (slashIndex > 0) {
      namespace = name.slice(1, slashIndex);
      name = name.slice(slashIndex + 1);
    }
  }

  // 解析版本
  const atIndex = name.lastIndexOf("@");
  if (atIndex > 0) {
    version = name.slice(atIndex + 1);
    name = name.slice(0, atIndex);
  }

  // 解析类型
  const colonIndex = name.indexOf(":");
  if (colonIndex > 0) {
    const typeStr = name.slice(0, colonIndex);
    if (["hook", "lib", "config"].includes(typeStr)) {
      type = typeStr as ResourceType;
      name = name.slice(colonIndex + 1);
    }
  }

  return { namespace, type, name, version };
}

/**
 * 格式化资源标识符
 */
export function formatResourceId(resource: ParsedResource): string {
  let id = "";
  
  if (resource.namespace !== "official") {
    id += `@${resource.namespace}/`;
  }
  
  if (resource.type !== "ui") {
    id += `${resource.type}:`;
  }
  
  id += resource.name;
  
  if (resource.version) {
    id += `@${resource.version}`;
  }
  
  return id;
}
