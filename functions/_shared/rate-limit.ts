import { intFromEnv, type Env } from "./env";

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetKey: string;
}

export async function getRateLimitStatus(request: Request, env: Env): Promise<RateLimitResult> {
  const limit = intFromEnv(env.DAILY_IP_LIMIT, 20);
  const ip = request.headers.get("cf-connecting-ip") ?? "local";
  const day = new Date().toISOString().slice(0, 10);
  const key = `ip:${day}:${ip}`;

  if (!env.RATE_LIMIT) {
    return { allowed: true, limit, remaining: limit, resetKey: key };
  }

  const current = Number.parseInt((await env.RATE_LIMIT.get(key)) ?? "0", 10);
  return {
    allowed: current < limit,
    limit,
    remaining: Math.max(0, limit - current),
    resetKey: key,
  };
}

export async function checkRateLimit(request: Request, env: Env): Promise<RateLimitResult> {
  const status = await getRateLimitStatus(request, env);
  if (!status.allowed || !env.RATE_LIMIT) return status;

  const used = status.limit - status.remaining + 1;
  await env.RATE_LIMIT.put(status.resetKey, String(used), { expirationTtl: 60 * 60 * 36 });
  return { ...status, remaining: Math.max(0, status.remaining - 1) };
}
