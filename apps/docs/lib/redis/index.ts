/**
 * Redis 客户端和缓存工具
 */
import { Redis } from "@upstash/redis";

// Redis 客户端单例
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// 缓存 TTL 配置 (秒)
const CACHE_TTL = {
  INDEX: 5 * 60, // 索引缓存 5 分钟
  RESOURCE: 60 * 60, // 资源缓存 1 小时
  USER: 10 * 60, // 用户信息缓存 10 分钟
};

/**
 * 获取缓存
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    return await redis.get<T>(key);
  } catch (error) {
    console.error("Redis get error:", error);
    return null;
  }
}

/**
 * 设置缓存
 */
export async function setCache<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
  try {
    if (ttlSeconds) {
      await redis.set(key, value, { ex: ttlSeconds });
    } else {
      await redis.set(key, value);
    }
  } catch (error) {
    console.error("Redis set error:", error);
  }
}

/**
 * 删除缓存
 */
export async function delCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    console.error("Redis del error:", error);
  }
}

/**
 * 删除匹配的缓存 (通过 pattern)
 */
export async function delCachePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error("Redis del pattern error:", error);
  }
}

// =====================================================
// 业务缓存方法
// =====================================================

/**
 * 缓存命名空间索引
 */
export async function cacheIndex(namespace: string, data: unknown): Promise<void> {
  await setCache(`index:${namespace}`, data, CACHE_TTL.INDEX);
}

export async function getCachedIndex<T>(namespace: string): Promise<T | null> {
  return getCache<T>(`index:${namespace}`);
}

/**
 * 缓存资源
 */
export async function cacheResource(
  namespace: string,
  type: string,
  name: string,
  version: string,
  data: unknown
): Promise<void> {
  const key = `resource:${namespace}:${type}:${name}:${version}`;
  // 版本化资源缓存更久
  const ttl = version === "latest" ? CACHE_TTL.RESOURCE : CACHE_TTL.RESOURCE * 24;
  await setCache(key, data, ttl);
}

export async function getCachedResource<T>(
  namespace: string,
  type: string,
  name: string,
  version: string
): Promise<T | null> {
  const key = `resource:${namespace}:${type}:${name}:${version}`;
  return getCache<T>(key);
}

/**
 * 清除命名空间相关缓存 (发布时调用)
 */
export async function invalidateNamespaceCache(namespace: string): Promise<void> {
  await delCache(`index:${namespace}`);
  await delCachePattern(`resource:${namespace}:*`);
}
