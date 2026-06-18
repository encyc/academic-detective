import { intFromEnv, type Env } from "./env";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetKey: string;
}

export async function checkRateLimit(request: Request, env: Env): Promise<RateLimitResult> {
  const limit = intFromEnv(env.DAILY_IP_LIMIT, 3);
  const ip = request.headers.get("cf-connecting-ip") ?? "local";
  const day = new Date().toISOString().slice(0, 10);
  const key = `ip:${day}:${ip}`;

  if (!env.RATE_LIMIT) {
    return { allowed: true, remaining: limit, resetKey: key };
  }

  const current = Number.parseInt((await env.RATE_LIMIT.get(key)) ?? "0", 10);
  if (current >= limit) {
    return { allowed: false, remaining: 0, resetKey: key };
  }

  await env.RATE_LIMIT.put(key, String(current + 1), { expirationTtl: 60 * 60 * 36 });
  return { allowed: true, remaining: Math.max(0, limit - current - 1), resetKey: key };
}
