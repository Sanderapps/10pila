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
};

export async function generateGeminiReply({ message, context }: GeminiInput) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = (process.env.GEMINI_MODEL ?? "gemini-3.1-flash-lite-preview").replace(
    /^models\//,
    ""
  );

  if (!apiKey) {
    return null;
  }

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
                "Voce e o vendedor tech da 10PILA. Responda em PT-BR, curto, util e comercial. " +
                "Use apenas os dados estruturados recebidos. Nao invente preco, estoque, prazo, desconto ou status. " +
                "Se faltar dado, diga isso com clareza. Tom informal, meme tech leve, sem exagero."
            }
          ]
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Contexto real da loja:\n${context}\n\nPergunta do cliente:\n${message}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 420
        }
      })
    }
  );

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as GeminiResponse;
  const text =
    data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .filter(Boolean)
      .join("\n")
      .trim() ?? "";

  return text || null;
}
