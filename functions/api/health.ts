import type { Env } from "../_shared/env";
import { json } from "../_shared/http";
import { getConfiguredProviders } from "../_shared/model-providers";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const providers = getConfiguredProviders(env).map((provider) => ({
    id: provider.id,
    label: provider.label,
  }));

  return json({
    ok: true,
    modelProvider: providers[0]?.id ?? "not-configured",
    providers,
    hasRateLimitKv: Boolean(env.RATE_LIMIT),
    hasR2: Boolean(env.PAPER_UPLOADS),
  });
};
