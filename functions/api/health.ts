import type { Env } from "../_shared/env";
import { json } from "../_shared/http";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  return json({
    ok: true,
    modelProvider: env.MODELSCOPE_API_KEY ? "modelscope" : "not-configured",
    hasRateLimitKv: Boolean(env.RATE_LIMIT),
    hasR2: Boolean(env.PAPER_UPLOADS),
  });
};
