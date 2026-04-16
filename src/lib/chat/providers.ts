import { AIAssistantMode, AIProvider } from "@prisma/client";
import { assistantModeLabel, modelForProvider, providerOrder, type StoredChatConfig } from "./config";

export type AIReplyStatus = "ok" | "missing_provider" | "provider_error";

export type AIReplyResult = {
  reply: string | null;
  status: AIReplyStatus;
  provider?: AIProvider;
};

type ProviderInput = {
  config: StoredChatConfig;
  message: string;
  context: string;
  pathname?: string;
  productFocus?: string;
  cardsSummary: string;
};

type ProviderRequest = {
  model: string;
  message: string;
  systemPrompt: string;
  temperature: number;
  maxOutputTokens: number;
};

type ProviderRunner = (input: ProviderRequest) => Promise<AIReplyResult>;

function buildSystemPrompt(mode: AIAssistantMode) {
  return [
    "Voce e o PilaBot, assistente oficial da 10PILA.",
    `Modo do assistente: ${assistantModeLabel(mode)}.`,
    "Responda em PT-BR.",
    "Tom: informal, tech, vendedor esperto, curto e util.",
    "Use apenas os dados reais recebidos.",
    "Nao invente preco, estoque, promocao, prazo, politica, status ou pedido.",
    "Nao faca dump de catalogo.",
    "Se pedirem link, devolva link markdown curto como [Ver produto](URL).",
    "Quando citar item, traga nome, preco, estoque e CTA curto.",
    "Se estiver numa pagina de produto, priorize esse item.",
    "Se faltar dado, admita isso e ofereca o proximo passo util.",
    "Feche com CTA curto sempre que fizer sentido."
  ].join("\n");
}

function buildUserPrompt({ context, pathname, productFocus, cardsSummary, message }: ProviderInput) {
  return [
    `Pagina atual: ${pathname ?? "/"}`,
    `Produto em foco: ${productFocus ?? "nenhum"}`,
    "Cards disponiveis:",
    cardsSummary,
    "",
    "Contexto real da loja:",
    context,
    "",
    "Pergunta do cliente:",
    message,
    "",
    "Responda em no maximo 4 blocos curtos."
  ].join("\n");
}

async function runGemini(input: ProviderRequest): Promise<AIReplyResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return { reply: null, status: "missing_provider" };
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${input.model.replace(
        /^models\//,
        ""
      )}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: input.systemPrompt }]
          },
          contents: [
            {
              role: "user",
              parts: [{ text: input.message }]
            }
          ],
          generationConfig: {
            temperature: input.temperature,
            topP: 0.9,
            maxOutputTokens: input.maxOutputTokens
          }
        }),
        signal: AbortSignal.timeout(12000)
      }
    );

    if (!response.ok) {
      const body = await response.text();
      console.error("[chat][provider][gemini] request failed", {
        status: response.status,
        body: body.slice(0, 300)
      });
      return { reply: null, status: "provider_error" };
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const reply =
      data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text)
        .filter(Boolean)
        .join("\n")
        .trim() ?? "";

    return reply ? { reply, status: "ok", provider: AIProvider.GEMINI } : { reply: null, status: "provider_error" };
  } catch (error) {
    console.error("[chat][provider][gemini] request error", {
      message: error instanceof Error ? error.message : "unknown"
    });
    return { reply: null, status: "provider_error" };
  }
}

async function runOpenAiCompat(
  provider: AIProvider,
  input: ProviderRequest
): Promise<AIReplyResult> {
  const apiKey =
    provider === AIProvider.GROQ ? process.env.GROQ_API_KEY : process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return { reply: null, status: "missing_provider" };
  }

  const url =
    provider === AIProvider.GROQ
      ? "https://api.groq.com/openai/v1/chat/completions"
      : "https://openrouter.ai/api/v1/chat/completions";

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  };

  if (provider === AIProvider.OPENROUTER) {
    headers["HTTP-Referer"] = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    headers["X-Title"] = "10PILA";
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: input.model,
        temperature: input.temperature,
        max_tokens: input.maxOutputTokens,
        messages: [
          { role: "system", content: input.systemPrompt },
          { role: "user", content: input.message }
        ]
      }),
      signal: AbortSignal.timeout(12000)
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[chat][provider][${provider.toLowerCase()}] request failed`, {
        status: response.status,
        body: body.slice(0, 300)
      });
      return { reply: null, status: "provider_error" };
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const reply = data.choices?.[0]?.message?.content?.trim() ?? "";

    return reply ? { reply, status: "ok", provider } : { reply: null, status: "provider_error" };
  } catch (error) {
    console.error(`[chat][provider][${provider.toLowerCase()}] request error`, {
      message: error instanceof Error ? error.message : "unknown"
    });
    return { reply: null, status: "provider_error" };
  }
}

function runnerFor(provider: AIProvider): ProviderRunner {
  if (provider === AIProvider.GROQ) {
    return (input) => runOpenAiCompat(AIProvider.GROQ, input);
  }

  if (provider === AIProvider.OPENROUTER) {
    return (input) => runOpenAiCompat(AIProvider.OPENROUTER, input);
  }

  return runGemini;
}

export async function generateAssistantReply(input: ProviderInput): Promise<AIReplyResult> {
  const providers = providerOrder(input.config);
  const systemPrompt = buildSystemPrompt(input.config.assistantMode);
  const userPrompt = buildUserPrompt(input);

  if (providers.length === 0) {
    return { reply: null, status: "missing_provider" };
  }

  let sawProviderError = false;

  for (const provider of providers) {
    const result = await runnerFor(provider)({
      model: modelForProvider(provider, input.config),
      message: userPrompt,
      systemPrompt,
      temperature: input.config.temperature,
      maxOutputTokens: input.config.maxOutputTokens
    });

    if (result.status === "ok") {
      return result;
    }

    if (result.status === "provider_error") {
      sawProviderError = true;
    }
  }

  return { reply: null, status: sawProviderError ? "provider_error" : "missing_provider" };
}
