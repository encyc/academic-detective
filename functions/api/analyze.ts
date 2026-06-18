import { intFromEnv, type Env } from "../_shared/env";
import { json, readJson } from "../_shared/http";
import { getProvider } from "../_shared/model-providers";
import { checkRateLimit } from "../_shared/rate-limit";
import { buildFraudDetectionPrompt } from "../_shared/skill";

interface AnalyzeRequest {
  fileName: string;
  mimeType: string;
  extractedText: string;
  userMessage?: string;
  providerId?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const limit = await checkRateLimit(request, env);
    if (!limit.allowed) {
      return json(
        { error: "今日免费分析次数已用完，请明天再试。", remaining: limit.remaining },
        { status: 429 },
      );
    }

    const body = await readJson<AnalyzeRequest>(request);
    const maxChars = intFromEnv(env.MAX_TEXT_CHARS, 60_000);
    const extractedText = (body.extractedText ?? "").trim();

    if (!body.fileName || extractedText.length < 200) {
      return json({ error: "没有提取到足够的论文文本。请确认文件不是纯扫描件。" }, { status: 400 });
    }

    const clippedText =
      extractedText.length > maxChars
        ? `${extractedText.slice(0, maxChars)}\n\n[系统提示：文本超过 ${maxChars} 字符，后续内容已截断。]`
        : extractedText;

    const provider = getProvider(env, body.providerId);
    const prompt = buildFraudDetectionPrompt({
      fileName: body.fileName,
      mimeType: body.mimeType,
      extractedText: clippedText,
      userMessage: body.userMessage,
    });

    const report = await provider.complete(
      [
        {
          role: "system",
          content:
            "你是公益学术诚信初筛工具 Academic Detective 的后端 Agent。输出必须克制、可复核、明确不确定性。",
        },
        { role: "user", content: prompt },
      ],
      request.signal,
    );

    return json({ report, remaining: limit.remaining, provider: provider.id, providerLabel: provider.label });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ error: message }, { status: 500 });
  }
};

export const onRequest: PagesFunction<Env> = async () => {
  return json({ error: "Method not allowed" }, { status: 405 });
};
