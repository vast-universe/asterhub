/**
 * 依赖解析器
 */
import type { ResourceRef, ResourceContent, ResolvedResource, ResourceFetcher } from "../types";

/**
 * 解析资源引用字符串
 */
export function parseResourceRef(input: string): ResourceRef | null {
  // @namespace/type:name@version 或 @namespace/name@version
  const match = input.match(
    /^@([a-z0-9_-]+)\/((?:hook|lib|config):)?([a-z0-9_-]+)(?:@(.+))?$/i
  );

  if (!match) return null;

  const [, namespace, typePrefix, name, version] = match;

  let type: ResourceRef["type"] = "ui";
  if (typePrefix) {
    const t = typePrefix.replace(":", "");
    type = t === "hook" ? "hook" : t === "lib" ? "lib" : t === "config" ? "config" : "ui";
  }

  return { namespace, type, name, version };
}

/**
 * 生成资源唯一标识
 */
export function getResourceKey(ref: ResourceRef): string {
  const typePrefix = ref.type === "ui" ? "" : `${ref.type}:`;
  return `@${ref.namespace}/${typePrefix}${ref.name}`;
}

/**
 * 依赖解析器类
 */
export class DependencyResolver {
  private nodes: Map<string, { ref: ResourceRef; dependencies: string[]; resolved: boolean }> =
    new Map();
  private resolved: Map<string, ResolvedResource> = new Map();
  private fetcher: ResourceFetcher;

  constructor(fetcher: ResourceFetcher) {
    this.fetcher = fetcher;
  }

  /**
   * 解析依赖树
   */
  async resolve(refs: ResourceRef[]): Promise<{
    resources: ResolvedResource[];
    order: string[];
    errors: string[];
  }> {
    const errors: string[] = [];

    // 收集所有依赖
    for (const ref of refs) {
      await this.collectDependencies(ref, [], errors);
    }

    // 拓扑排序
    const order = this.topologicalSort(errors);

    // 返回结果
    const resources = order
      .map((key) => this.resolved.get(key))
      .filter((r): r is ResolvedResource => r !== undefined);

    return { resources, order, errors };
  }

  /**
   * 递归收集依赖
   */
  private async collectDependencies(
    ref: ResourceRef,
    path: string[],
    errors: string[]
  ): Promise<void> {
    const key = getResourceKey(ref);

    // 检查循环依赖
    if (path.includes(key)) {
      const cycle = [...path.slice(path.indexOf(key)), key].join(" → ");
      errors.push(`循环依赖: ${cycle}`);
      return;
    }

    // 已处理过
    if (this.nodes.has(key)) {
      return;
    }

    // 获取资源
    const resource = await this.fetcher(ref);
    if (!resource) {
      errors.push(`找不到资源: ${key}`);
      return;
    }

    // 记录节点
    const depKeys = resource.dependencies.map(getResourceKey);
    this.nodes.set(key, { ref, dependencies: depKeys, resolved: false });
    this.resolved.set(key, resource);

    // 递归处理依赖
    for (const dep of resource.dependencies) {
      await this.collectDependencies(dep, [...path, key], errors);
    }
  }

  /**
   * 拓扑排序
   */
  private topologicalSort(errors: string[]): string[] {
    const inDegree: Map<string, number> = new Map();
    const adjacency: Map<string, string[]> = new Map();

    // 初始化
    for (const [key] of this.nodes) {
      inDegree.set(key, 0);
      adjacency.set(key, []);
    }

    // 计算入度
    for (const [key, node] of this.nodes) {
      for (const dep of node.dependencies) {
        if (this.nodes.has(dep)) {
          adjacency.get(dep)!.push(key);
          inDegree.set(key, (inDegree.get(key) || 0) + 1);
        }
      }
    }

    // 找出入度为 0 的节点
    const queue: string[] = [];
    for (const [key, degree] of inDegree) {
      if (degree === 0) {
        queue.push(key);
      }
    }

    // 排序
    const result: string[] = [];
    while (queue.length > 0) {
      const key = queue.shift()!;
      result.push(key);

      for (const dependent of adjacency.get(key) || []) {
        const newDegree = (inDegree.get(dependent) || 1) - 1;
        inDegree.set(dependent, newDegree);
        if (newDegree === 0) {
          queue.push(dependent);
        }
      }
    }

    // 检查是否有循环
    if (result.length !== this.nodes.size) {
      const remaining = [...this.nodes.keys()].filter((k) => !result.includes(k));
      errors.push(`无法解析依赖顺序: ${remaining.join(", ")}`);
    }

    return result;
  }

  /**
   * 清理状态
   */
  clear(): void {
    this.nodes.clear();
    this.resolved.clear();
  }
}
