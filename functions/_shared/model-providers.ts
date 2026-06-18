import type { Env } from "./env";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatProvider {
  id: string;
  complete(messages: ChatMessage[], signal?: AbortSignal): Promise<string>;
}

interface OpenAICompatibleOptions {
  id: string;
  apiKey: string;
  baseUrl: string;
  model: string;
}

export function createOpenAICompatibleProvider(options: OpenAICompatibleOptions): ChatProvider {
  const baseUrl = options.baseUrl.replace(/\/$/, "");

  return {
    id: options.id,
    async complete(messages, signal) {
      const response = await fetch(`${baseUrl}/chat/completions`, {
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

export function getDefaultProvider(env: Env): ChatProvider {
  const apiKey = env.MODELSCOPE_API_KEY;
  if (!apiKey) {
    throw new Error("MODELSCOPE_API_KEY is not configured.");
  }

  return createOpenAICompatibleProvider({
    id: "modelscope",
    apiKey,
    baseUrl: env.MODELSCOPE_BASE_URL ?? "https://api-inference.modelscope.cn/v1",
    model: env.MODELSCOPE_MODEL ?? "Qwen/Qwen3-30B-A3B-Instruct-2507",
  });
}
