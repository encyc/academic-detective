import type { Env } from "../_shared/env";
import { json } from "../_shared/http";
import { getConfiguredProviders } from "../_shared/model-providers";
import { getRateLimitStatus } from "../_shared/rate-limit";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const providers = getConfiguredProviders(env).map((provider) => ({
    id: provider.id,
    label: provider.label,
    group: provider.group,
    model: provider.model,
  }));
  const rateLimit = await getRateLimitStatus(request, env);

  return json({
    providers,
    rateLimit: {
      limit: rateLimit.limit,
      remaining: rateLimit.remaining,
    },
  });
};
