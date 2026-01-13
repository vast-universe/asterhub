/**
 * API 限流
 */
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./index";

// 限流器配置
export const rateLimiters = {
  // 全局限流 (按 IP) - 每分钟 100 次
  global: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1m"),
    prefix: "rl:global",
  }),

  // 下载限流 (按 IP) - 每分钟 60 次
  download: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, "1m"),
    prefix: "rl:download",
  }),

  // 发布限流 (按用户) - 每小时 10 次
  publish: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1h"),
    prefix: "rl:publish",
  }),

  // 登录限流 (按 IP) - 每 15 分钟 5 次
  login: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "15m"),
    prefix: "rl:login",
  }),

  // 搜索限流 (按 IP) - 每分钟 30 次
  search: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "1m"),
    prefix: "rl:search",
  }),
};

export type RateLimitType = keyof typeof rateLimiters;

/**
 * 检查限流
 */
export async function checkRateLimit(
  type: RateLimitType,
  identifier: string
): Promise<{
  success: boolean;
  remaining: number;
  reset: number;
}> {
  try {
    const result = await rateLimiters[type].limit(identifier);
    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    console.error("Rate limit error:", error);
    // 限流服务出错时放行
    return { success: true, remaining: -1, reset: 0 };
  }
}

/**
 * 获取客户端 IP
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  return "unknown";
}

/**
 * 限流响应
 */
export function rateLimitResponse(reset: number) {
  const retryAfter = Math.ceil((reset - Date.now()) / 1000);
  return new Response(
    JSON.stringify({
      error: "请求过于频繁，请稍后再试",
      code: "RATE_LIMITED",
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
      },
    }
  );
}
