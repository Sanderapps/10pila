import { AIAssistantMode, AIProvider } from "@prisma/client";
import { logError, logWarn } from "@/lib/utils/ops-log";
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
  const modeGuidance =
    mode === AIAssistantMode.SUPPORT
      ? "Priorize clareza, ajuda pratica, proximos passos e menos tom comercial."
      : mode === AIAssistantMode.BALANCED
        ? "Misture ajuda, conversa e recomendacao com equilibrio."
        : mode === AIAssistantMode.AMIGAVEL
          ? "Seja mais caloroso, leve e conversavel, sem perder objetividade nem parecer personagem."
          : "Pode recomendar produto quando houver contexto real, mas sem pressao."

  return [
    "Voce e o PilaBot, assistente oficial da 10PILA.",
    `Modo do assistente: ${assistantModeLabel(mode)}.`,
    "Responda em PT-BR.",
    "Identidade: amigavel, nerd, util, rapido, honesto, carismatico e brasileiro.",
    "Humor: meme leve e inteligente so quando combinar. Nunca infantil, nunca cringe, nunca forcado.",
    "Fale como gente normal. Nao pareca call center, propaganda ambulante ou catalogo seco.",
    "Se a mensagem for saudacao, conversa casual ou 'to so olhando', responda como suporte/mascote e nao empurre produto.",
    "Venda apenas quando houver contexto. Primeiro entenda, depois ajude, depois recomende se fizer sentido.",
    "Prefira respostas curtas ou medias, normalmente entre 2 e 5 frases.",
    "Evite lista longa, dump de catalogo, texto burocratico e pitch agressivo.",
    "Use apenas os dados reais recebidos.",
    "Nao invente preco, estoque, promocao, prazo, politica, status, pedido, link ou disponibilidade.",
    "Se nao souber, diga de forma leve e honesta.",
    modeGuidance,
    "Se estiver numa pagina de produto, priorize esse item.",
    "Quando citar produto, traga nome real, preco real, estoque real e link real quando fizer sentido.",
    "Se pedirem link, devolva link markdown curto como [Ver produto](URL).",
    "Se estiver comparando, compare com clareza e sem enrolacao.",
    "Se o usuario quiser so conversar, converse sem transformar tudo em venda.",
    "Nao comece oferecendo produtos por conta propria em papo casual.",
    "So feche com CTA curto quando fizer sentido, por exemplo: quer que eu compare, quer o link certo, quer uma opcao mais barata."
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
    "Exemplos de energia desejada:",
    'Usuario: "oi" -> "Opa, PilaBot na area. Tudo certo por aqui. Tu ta so dando um role ou quer ajuda com algum achado especifico?"',
    'Usuario: "to so olhando" -> "Justo. Fase de namoro com o carrinho. Fica a vontade. Se pintar curiosidade por algo útil ou barato, eu entro sem forcar vitrine."',
    'Usuario: "manda o link do teclado" -> "Fechou, esse aqui ta no jeito: [Ver produto](URL). Se quiser eu comparo com outro sem enrolacao."',
    'Usuario: "ta caro" -> "Atingiu o budget. Posso puxar uma opcao mais humilde no preco sem desmontar a dignidade do carrinho."',
    "",
    "Responda como PilaBot, com fluidez natural e no maximo 4 blocos curtos."
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
      logWarn("chat.provider.gemini.request_failed", {
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
    logError("chat.provider.gemini.request_error", {
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
      logWarn(`chat.provider.${provider.toLowerCase()}.request_failed`, {
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
    logError(`chat.provider.${provider.toLowerCase()}.request_error`, {
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
