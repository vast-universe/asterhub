/**
 * Registry 服务
 */
import { get, post } from "../lib/http";
import type { NamespaceInfo, ResourceContent, SearchResult } from "../types";

/**
 * 搜索资源
 */
export async function searchResources(
  query: string,
  options?: {
    type?: string;
    namespace?: string;
  }
): Promise<SearchResult[]> {
  const params = new URLSearchParams({ q: query });
  if (options?.type) params.set("type", options.type);
  if (options?.namespace) params.set("namespace", options.namespace);
  return get<SearchResult[]>(`/api/search?${params}`);
}

/**
 * 获取资源详情
 */
export async function getResource(
  namespace: string,
  type: string,
  name: string,
  version?: string
): Promise<ResourceContent> {
  const v = version || "latest";
  return get<ResourceContent>(`/api/registry/${namespace}/${type}/${name}/${v}`);
}

/**
 * 发布资源
 */
export async function publishResource(resource: ResourceContent): Promise<void> {
  await post("/api/registry/publish", resource);
}

/**
 * 获取命名空间列表
 */
export async function getNamespaces(): Promise<NamespaceInfo[]> {
  return get<NamespaceInfo[]>("/api/namespaces");
}

/**
 * 创建命名空间
 */
export async function createNamespace(name: string, description?: string): Promise<NamespaceInfo> {
  return post<NamespaceInfo>("/api/namespaces", { name, description });
}

/**
 * 删除命名空间
 */
export async function deleteNamespace(name: string): Promise<void> {
  await post(`/api/namespaces/${name}/delete`, {});
}
