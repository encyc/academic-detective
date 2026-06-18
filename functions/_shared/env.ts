export interface Env {
  MODELSCOPE_API_KEY?: string;
  MODELSCOPE_BASE_URL?: string;
  MODELSCOPE_MODEL?: string;
  DAILY_IP_LIMIT?: string;
  MAX_TEXT_CHARS?: string;
  RATE_LIMIT?: KVNamespace;
  PAPER_UPLOADS?: R2Bucket;
}

export function intFromEnv(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
