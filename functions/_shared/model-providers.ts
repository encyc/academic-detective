import type { Env } from "./env";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatProvider {
  id: string;
  label: string;
  group: "modelscope" | "opencode-zen";
  model: string;
  complete(messages: ChatMessage[], signal?: AbortSignal): Promise<string>;
}

interface OpenAICompatibleOptions {
  id: string;
  label: string;
  group: ChatProvider["group"];
  apiKey: string;
  baseUrl?: string;
  chatCompletionsUrl?: string;
  model: string;
}

export function createOpenAICompatibleProvider(options: OpenAICompatibleOptions): ChatProvider {
  const endpoint =
    options.chatCompletionsUrl ?? `${(options.baseUrl ?? "").replace(/\/$/, "")}/chat/completions`;

  return {
    id: options.id,
    label: options.label,
    group: options.group,
    model: options.model,
    async complete(messages, signal) {
      const response = await fetch(endpoint, {
        method: "POST",
        signal,
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${options.apiKey}`,
        },
        body: JSON.stringify({
          model: options.model,
          messages,
          temperature: 0.2,
          max_tokens: 4096,
        }),
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Model provider ${options.id} failed: ${response.status} ${detail.slice(0, 500)}`);
      }

      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = payload.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error(`Model provider ${options.id} returned an empty response.`);
      }
      return content;
    },
  };
}

export function getProvider(env: Env, requestedProviderId?: string): ChatProvider {
  const providers = getConfiguredProviders(env);
  const providerId = requestedProviderId || env.DEFAULT_PROVIDER_ID || "modelscope";
  const provider =
    providerId === "modelscope"
      ? providers.find((candidate) => candidate.id === DEFAULT_MODELSCOPE_PROVIDER_ID)
      : providers.find((candidate) => candidate.id === providerId);

  if (!provider) {
    const configured = providers.map((candidate) => candidate.id).join(", ") || "none";
    throw new Error(`Provider ${providerId} is not configured. Configured providers: ${configured}.`);
  }

  return provider;
}

export function getConfiguredProviders(env: Env): ChatProvider[] {
  const providers: ChatProvider[] = [];

  const apiKey = env.MODELSCOPE_API_KEY;
  if (apiKey) {
    providers.push(
      ...MODELSCOPE_MODELS.map((model) =>
        createOpenAICompatibleProvider({
          id: `modelscope:${model.id}`,
          label: model.label,
          group: "modelscope",
          apiKey,
          baseUrl: env.MODELSCOPE_BASE_URL ?? "https://api-inference.modelscope.cn/v1",
          model: model.id,
        }),
      ),
    );
  }

  if (env.OPENCODE_ZEN_API_KEY) {
    providers.push(
      ...ZEN_FREE_MODELS.map((model) =>
        createOpenAICompatibleProvider({
          id: `opencode-zen:${model.id}`,
          label: model.label,
          group: "opencode-zen",
          apiKey: env.OPENCODE_ZEN_API_KEY!,
          chatCompletionsUrl: "https://opencode.ai/zen/v1/chat/completions",
          model: model.id,
        }),
      ),
    );
  }

  return providers;
}

export const DEFAULT_MODELSCOPE_MODEL = "Qwen/Qwen3-30B-A3B-Instruct-2507";

export const DEFAULT_MODELSCOPE_PROVIDER_ID = `modelscope:${DEFAULT_MODELSCOPE_MODEL}`;

export const MODELSCOPE_MODELS = [
  { id: DEFAULT_MODELSCOPE_MODEL, label: "Qwen3 30B A3B Instruct" },
  { id: "deepseek-ai/DeepSeek-V4-Flash", label: "DeepSeek V4 Flash" },
  { id: "deepseek-ai/DeepSeek-V3.2", label: "DeepSeek V3.2" },
  { id: "Qwen/Qwen3-235B-A22B-Instruct-2507", label: "Qwen3 235B A22B Instruct" },
  { id: "Qwen/Qwen3-235B-A22B-Thinking-2507", label: "Qwen3 235B A22B Thinking" },
  { id: "Qwen/Qwen3-30B-A3B", label: "Qwen3 30B A3B" },
  { id: "Qwen/Qwen3-30B-A3B-Thinking-2507", label: "Qwen3 30B A3B Thinking" },
  { id: "Qwen/Qwen3-Next-80B-A3B-Instruct", label: "Qwen3 Next 80B A3B Instruct" },
  { id: "Qwen/Qwen3.5-397B-A17B", label: "Qwen3.5 397B A17B" },
  { id: "moonshotai/Kimi-K2.5", label: "Kimi K2.5" },
  { id: "MiniMax/MiniMax-M3", label: "MiniMax M3" },
  { id: "ZhipuAI/GLM-5.2", label: "GLM 5.2" },
  { id: "stepfun-ai/Step-3.7-Flash", label: "Step 3.7 Flash" },
  { id: "XiaomiMiMo/MiMo-V2-Flash", label: "MiMo V2 Flash" },
] as const;

export const ZEN_FREE_MODELS = [
  { id: "mimo-v2.5-free", label: "MiMo-V2.5 Free" },
  { id: "north-mini-code-free", label: "North Mini Code Free" },
  { id: "nemotron-3-ultra-free", label: "Nemotron 3 Ultra Free" },
  { id: "deepseek-v4-flash-free", label: "DeepSeek V4 Flash Free" },
] as const;
