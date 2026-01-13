/**
 * Registry 服务 - 组件仓库 API
 */
import { get, post } from "../lib/http";
import type {
  ResourceRef,
  ResourceContent,
  ResourceType,
  Framework,
  Style,
  SearchResult,
  VersionInfo,
  SecurityAdvisory,
} from "../types";

/**
 * 获取资源
 */
export async function fetchResource(
  ref: ResourceRef,
  framework: Framework = "expo",
  style?: Style
): Promise<ResourceContent> {
  const typePrefix = ref.type === "ui" ? "" : `${ref.type}:`;
  const version = ref.version || "latest";

  const params = new URLSearchParams({ framework });
  if (style && ref.type === "ui") {
    params.set("style", style);
  }

  return get<ResourceContent>(
    `/api/registry/${ref.namespace}/${typePrefix}${ref.name}/${version}?${params}`
  );
}

/**
 * 搜索资源
 */
export async function searchResources(
  query: string,
  options: {
    type?: ResourceType;
    namespace?: string;
    framework?: Framework;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ items: SearchResult[]; total: number }> {
  const params = new URLSearchParams();
  params.set("q", query);
  if (options.type) params.set("type", options.type);
  if (options.namespace) params.set("namespace", options.namespace);
  if (options.framework) params.set("framework", options.framework);
  if (options.limit) params.set("limit", String(options.limit));
  if (options.offset) params.set("offset", String(options.offset));

  return get<{ items: SearchResult[]; total: number }>(
    `/api/registry/search?${params}`
  );
}

/**
 * 获取所有资源列表
 */
export async function fetchAllResources(
  options: {
    type?: ResourceType;
    framework?: Framework;
    style?: Style;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ items: SearchResult[]; total: number }> {
  const params = new URLSearchParams();
  if (options.type) params.set("type", options.type);
  if (options.framework) params.set("framework", options.framework);
  if (options.style) params.set("style", options.style);
  if (options.limit) params.set("limit", String(options.limit));
  if (options.offset) params.set("offset", String(options.offset));

  return get<{ items: SearchResult[]; total: number }>(`/api/registry?${params}`);
}

/**
 * 获取命名空间下的资源
 */
export async function fetchNamespaceResources(
  namespace: string,
  options: {
    type?: ResourceType;
    framework?: Framework;
  } = {}
): Promise<{
  namespace: string;
  resources: Array<{
    name: string;
    type: ResourceType;
    description?: string;
    latestVersion: string;
  }>;
}> {
  const params = new URLSearchParams();
  if (options.type) params.set("type", options.type);
  if (options.framework) params.set("framework", options.framework);

  return get(`/api/registry/${namespace}?${params}`);
}

/**
 * 获取资源版本列表
 */
export async function fetchResourceVersions(
  ref: Omit<ResourceRef, "version">
): Promise<{ versions: VersionInfo[] }> {
  const typePrefix = ref.type === "ui" ? "" : `${ref.type}:`;
  return get(`/api/registry/${ref.namespace}/${typePrefix}${ref.name}/versions`);
}

/**
 * 检查安全公告
 */
export async function checkSecurityAdvisories(
  refs: ResourceRef[]
): Promise<{ advisories: SecurityAdvisory[] }> {
  return post(
    "/api/security/check",
    { resources: refs },
    { auth: true }
  );
}

/**
 * 发布资源
 */
export async function publishResources(data: {
  namespace: string;
  index: any;
  resources: any[];
}): Promise<{
  success: boolean;
  published: Array<{ name: string; type: ResourceType; version: string }>;
  errors?: Array<{ name: string; error: string }>;
}> {
  return post("/api/registry/publish", data, { auth: true });
}
