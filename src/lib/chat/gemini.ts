import type { ChatProductCard } from "./assistant";

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

type GeminiInput = {
  message: string;
  context: string;
  pathname?: string;
  currentProduct: ChatProductCard | null;
  products: ChatProductCard[];
};

export type GeminiReplyStatus = "ok" | "missing_api_key" | "provider_error";

type GeminiReplyResult = {
  reply: string | null;
  status: GeminiReplyStatus;
};

function buildPrompt({ context, pathname, currentProduct, products }: GeminiInput) {
  const productCards =
    products.length > 0
      ? products
          .slice(0, 4)
          .map(
            (product) =>
              `- ${product.name} | ${product.price} | estoque ${product.stock} | link ${product.url}`
          )
          .join("\n")
      : "- nenhum produto relevante encontrado";

  return [
    "Voce e o vendedor tech da 10PILA.",
    "Escreva em PT-BR.",
    "Tom: informal, tech, vendedor esperto, curto e util.",
    "Nao invente preco, estoque, promocao, prazo, politica nem status de pedido.",
    "Use apenas o contexto estruturado recebido.",
    "Evite lista longa e texto burocratico.",
    "Se a pergunta pedir link, devolva um link markdown curto no formato [Ver produto](URL).",
    "Quando citar produto, traga nome, preco, estoque e CTA curto.",
    "Se houver produto da pagina atual, priorize esse item na resposta.",
    "Se faltar dado, diga isso claramente e ofereca o proximo passo util.",
    "",
    `Pagina atual: ${pathname ?? "/"}`,
    `Produto em foco: ${currentProduct ? `${currentProduct.name} | ${currentProduct.price} | estoque ${currentProduct.stock}` : "nenhum"}`,
    "Cards disponiveis para citar:",
    productCards,
    "",
    "Contexto real da loja:",
    context,
    "",
    "Responda em no maximo 4 blocos curtos."
  ].join("\n");
}

export async function generateGeminiReply(input: GeminiInput): Promise<GeminiReplyResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = (process.env.GEMINI_MODEL ?? "gemini-3.1-flash-lite-preview").replace(
    /^models\//,
    ""
  );

  if (!apiKey) {
    return { reply: null, status: "missing_api_key" };
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text:
                  "Voce vende produtos da 10PILA com base em dados reais. " +
                  "Seja curto, direto, comercial e confiavel. Nada de inventar."
              }
            ]
          },
          contents: [
            {
              role: "user",
              parts: [{ text: buildPrompt(input) + `\n\nPergunta do cliente:\n${input.message}` }]
            }
          ],
          generationConfig: {
            temperature: 0.32,
            topP: 0.9,
            maxOutputTokens: 360
          }
        }),
        signal: AbortSignal.timeout(12000)
      }
    );

    if (!response.ok) {
      const body = await response.text();
      console.error("[chat][gemini] provider error", {
        status: response.status,
        body: body.slice(0, 300)
      });
      return { reply: null, status: "provider_error" };
    }

    const data = (await response.json()) as GeminiResponse;
    const text =
      data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text)
        .filter(Boolean)
        .join("\n")
        .trim() ?? "";

    return text ? { reply: text, status: "ok" } : { reply: null, status: "provider_error" };
  } catch (error) {
    console.error("[chat][gemini] request failed", {
      message: error instanceof Error ? error.message : "unknown"
    });
    return { reply: null, status: "provider_error" };
  }
}
