import type { Product } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { centsToBRL } from "@/lib/utils/money";
import { getChatAssistantConfig } from "./config";
import { generateAssistantReply, type AIReplyStatus } from "./providers";

export type ChatProductCard = {
  id: string;
  name: string;
  slug: string;
  price: string;
  stock: number;
  imageUrl: string;
  url: string;
};

export type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatAnswer = {
  reply: string;
  products: ChatProductCard[];
  quickActions: string[];
  source: "ai" | "fallback";
  fallbackReason?:
    | "missing_provider"
    | "provider_error"
    | "auth_required"
    | "no_product_match"
    | "deterministic";
};

type AnswerInput = {
  message: string;
  userId?: string;
  currentProductSlug?: string;
  pathname?: string;
  history?: ChatHistoryMessage[];
};

const STOPWORDS = new Set([
  "a",
  "ao",
  "as",
  "com",
  "da",
  "de",
  "do",
  "dos",
  "e",
  "eu",
  "link",
  "me",
  "mostra",
  "mostrar",
  "na",
  "no",
  "o",
  "os",
  "para",
  "pra",
  "produto",
  "quero",
  "sobre",
  "tem",
  "uma",
  "um",
  "voce"
]);

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function productUrl(slug: string) {
  return `${appUrl()}/produtos/${slug}`;
}

function cardFromProduct(product: Product): ChatProductCard {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: centsToBRL(product.promotionalCents ?? product.priceCents),
    stock: product.stock,
    imageUrl: product.imageUrl,
    url: productUrl(product.slug)
  };
}

function productSummary(product: Product) {
  const price = centsToBRL(product.promotionalCents ?? product.priceCents);
  const stock = product.stock > 0 ? `${product.stock} em estoque` : "sem estoque";
  const promo = product.promotionalCents ? `promo ativa sobre ${centsToBRL(product.priceCents)}` : "sem promo";
  return `${product.name} | preco ${price} | ${stock} | ${promo} | link ${productUrl(product.slug)}`;
}

function searchTerms(message: string) {
  return message
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 3 && !STOPWORDS.has(term));
}

function wantsOrders(message: string) {
  return /pedido|entrega|status|rastrei|compra/.test(message.toLowerCase());
}

function isGreeting(message: string) {
  return /^(oi+|opa+|ola+|e ai|iae|fala+|salve|bom dia|boa tarde|boa noite)[!. ]*$/i.test(
    message.trim()
  );
}

function isJustBrowsing(message: string) {
  return /to so olhando|t[oô] s[oó] olhando|so olhando|s[oó] dando uma olhada|s[oó] de boa/i.test(
    message.toLowerCase()
  );
}

function wantsRecommendation(message: string) {
  return /me recomenda|recomenda algo|o que voce indica|me indica|sugere algo/.test(
    message.toLowerCase()
  );
}

function wantsChat(message: string) {
  return /kkk|haha|hehe|so pra trocar ideia|so conversar|trocar ideia|brincando/.test(
    message.toLowerCase()
  );
}

function wantsPromos(message: string) {
  return /promo|promoc|desconto|oferta/.test(message.toLowerCase());
}

function wantsCheaper(message: string) {
  return /mais barato|barato|menor preco|economizar|custo beneficio/.test(message.toLowerCase());
}

function wantsLink(message: string) {
  return /link|url|pagina/.test(message.toLowerCase());
}

function wantsCompare(message: string) {
  return /compar|vs|melhor que|diferen/.test(message.toLowerCase());
}

function wantsDetails(message: string) {
  return /detalhe|ficha|spec|especific|como e|o que tem/.test(message.toLowerCase());
}

function wantsSimilar(message: string) {
  return /parecido|semelhante|outra opcao|alternativa/.test(message.toLowerCase());
}

function wantsAddToCart(message: string) {
  return /adiciona|adicionar|coloca no carrinho|leva 1|quero 1/.test(message.toLowerCase());
}

function quickActionsFor(message: string, hasProducts: boolean) {
  const actions = new Set<string>();

  if (hasProducts) {
    if (wantsDetails(message)) {
      actions.add("ver detalhes");
    }
    if (wantsCompare(message) || wantsSimilar(message)) {
      actions.add("comparar");
    }
    if (wantsAddToCart(message)) {
      actions.add("adicionar 1 ao carrinho");
    }
    actions.add("ver detalhes");
    actions.add("comparar");
    actions.add("adicionar 1 ao carrinho");
  }

  if (wantsOrders(message)) {
    actions.add("ir para o carrinho");
  } else {
    actions.add("mais barato");
    actions.add("ver promocoes");
  }

  return Array.from(actions).slice(0, 4);
}

function conversationalReply(message: string) {
  if (isGreeting(message)) {
    return "Opa, PilaBot na area. Ta caçando achado, montando setup ou so dando um role tech?";
  }

  if (isJustBrowsing(message)) {
    return "Justo. Fase de namoro com o carrinho. Se quiser, eu posso te mostrar so os achados mais honestos da loja.";
  }

  if (wantsChat(message)) {
    return "Fechou, da pra trocar uma ideia sem transformar isso em pitch. Se pintar vontade de garimpar alguma utilidade barata, eu entro no modo util na hora.";
  }

  if (wantsRecommendation(message)) {
    return "Posso sim, mas me da teu estilo: tu quer praticidade, organizacao, coisa curiosa de mesa ou custo-beneficio honesto?";
  }

  return null;
}

async function getCurrentProduct(currentProductSlug?: string) {
  if (!currentProductSlug) {
    return null;
  }

  return prisma.product.findFirst({
    where: { slug: currentProductSlug, active: true }
  });
}

async function relevantProducts(message: string, currentProductSlug?: string) {
  const terms = searchTerms(message);
  const currentProduct = await getCurrentProduct(currentProductSlug);
  const prefersPromo = wantsPromos(message);
  const prefersCheaper = wantsCheaper(message);

  const products = await prisma.product.findMany({
    where: {
      active: true,
      OR:
        terms.length > 0
          ? terms.flatMap((term) => [
              { name: { contains: term, mode: "insensitive" as const } },
              { description: { contains: term, mode: "insensitive" as const } },
              { slug: { contains: term, mode: "insensitive" as const } },
              { category: { contains: term, mode: "insensitive" as const } }
            ])
          : undefined,
      promotionalCents: prefersPromo ? { not: null } : undefined
    },
    orderBy: prefersCheaper
      ? [{ promotionalCents: "asc" }, { priceCents: "asc" }, { stock: "desc" }]
      : prefersPromo
        ? [{ promotionalCents: "asc" }, { updatedAt: "desc" }]
        : [{ featured: "desc" }, { updatedAt: "desc" }],
    take: 8
  });

  const unique = new Map<string, Product>();

  if (currentProduct) {
    unique.set(currentProduct.id, currentProduct);
  }

  products
    .map((product) => {
      const haystack = `${product.name} ${product.description} ${product.slug} ${
        product.category ?? ""
      }`.toLowerCase();
      const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 2 : 0), 0);
      const currentBoost = currentProduct && currentProduct.id === product.id ? 4 : 0;
      return { product, score: score + currentBoost + Number(product.featured) };
    })
    .sort((a, b) => b.score - a.score)
    .forEach(({ product }) => unique.set(product.id, product));

  if (unique.size === 0 && currentProduct) {
    unique.set(currentProduct.id, currentProduct);
  }

  if (unique.size === 0) {
    const fallback = await prisma.product.findMany({
      where: { active: true },
      orderBy: prefersCheaper
        ? [{ promotionalCents: "asc" }, { priceCents: "asc" }, { stock: "desc" }]
        : [{ featured: "desc" }, { updatedAt: "desc" }],
      take: 4
    });
    fallback.forEach((product) => unique.set(product.id, product));
  }

  return Array.from(unique.values()).slice(0, 5);
}

async function orderContext(userId?: string) {
  if (!userId) {
    return {
      context: "Cliente nao esta logado. Nao revele pedidos sem login.",
      reply:
        "Pra consultar pedido eu preciso do login. Seguranca primeiro, pedido alheio nao entra no radar."
    };
  }

  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 3,
    include: { items: true }
  });

  if (orders.length === 0) {
    return {
      context: "Cliente logado sem pedidos encontrados.",
      reply: "Nao achei pedido na sua conta ainda. Se quiser, eu te ajudo a montar o primeiro."
    };
  }

  const lines = orders.map(
    (order) =>
      `Pedido ${order.id.slice(0, 8)} | status ${order.status} | total ${centsToBRL(
        order.totalCents
      )} | itens ${order.items.map((item) => `${item.quantity}x ${item.name}`).join(", ")}`
  );

  return {
    context: lines.join("\n"),
    reply: lines.join("\n")
  };
}

function buildHistory(history?: ChatHistoryMessage[]) {
  if (!history || history.length === 0) {
    return "Sem historico relevante.";
  }

  return history
    .slice(-6)
    .map((entry) => `${entry.role === "user" ? "Cliente" : "Assistente"}: ${entry.content}`)
    .join("\n");
}

function fallbackReply(
  message: string,
  products: Product[],
  cards: ChatProductCard[],
  orderData: Awaited<ReturnType<typeof orderContext>> | null,
  providerStatus: AIReplyStatus
): ChatAnswer {
  const fallbackReason: ChatAnswer["fallbackReason"] =
    providerStatus === "provider_error"
      ? "provider_error"
      : providerStatus === "missing_provider"
        ? "missing_provider"
        : "deterministic";

  const smallTalk = conversationalReply(message);

  if (smallTalk) {
    return {
      reply: smallTalk,
      products: [],
      quickActions: ["ver promocoes", "mais barato", "comparar"],
      source: "fallback",
      fallbackReason
    };
  }

  if (wantsOrders(message) && orderData) {
    return {
      reply: orderData.reply,
      products: cards,
      quickActions: ["acompanhar pedido", "ver promocoes", "ir para o carrinho"],
      source: "fallback",
      fallbackReason: orderData.context.includes("nao esta logado") ? "auth_required" : "deterministic"
    };
  }

  if (products.length === 0) {
    return {
      reply:
        "Nao achei um item batendo certinho com isso agora. Me manda o nome, a categoria ou o tipo de produto que eu refino sem chutar.",
      products: [],
      quickActions: ["ver promocoes", "mais barato"],
      source: "fallback",
      fallbackReason: "no_product_match"
    };
  }

  if (wantsLink(message)) {
    const first = products[0];
    return {
      reply: `Link certo: [${first.name}](${productUrl(first.slug)})\n${first.name} | ${centsToBRL(
        first.promotionalCents ?? first.priceCents
      )} | ${first.stock} em estoque.\nSe quiser, eu comparo com outro sem enrolacao.`,
      products: cards,
      quickActions: quickActionsFor(message, cards.length > 0),
      source: "fallback",
      fallbackReason
    };
  }

  if (wantsRecommendation(message) && products.length > 0 && searchTerms(message).length <= 1) {
    return {
      reply:
        "Posso recomendar, mas antes eu calibro isso melhor contigo: tu quer algo mais util, mais curioso ou mais custo-beneficio?",
      products: cards.slice(0, 2),
      quickActions: ["mais barato", "comparar", "ver detalhes"],
      source: "fallback",
      fallbackReason
    };
  }

  const lines = products.map((product) => {
    const price = centsToBRL(product.promotionalCents ?? product.priceCents);
    return `${product.name} | ${price} | estoque ${product.stock} | [Ver produto](${productUrl(
      product.slug
    )})`;
  });

  return {
      reply: `${wantsCheaper(message) ? "Puxei as opcoes mais em conta que achei no estoque real:" : "Achei isso aqui no estoque real da loja:"}\n${lines.join("\n")}`,
      products: cards,
      quickActions: quickActionsFor(message, cards.length > 0),
      source: "fallback",
      fallbackReason
    };
  }

export async function answerFromStoreData({
  message,
  userId,
  currentProductSlug,
  pathname,
  history
}: AnswerInput): Promise<ChatAnswer> {
  const [products, orderData, currentProduct] = await Promise.all([
    relevantProducts(message, currentProductSlug),
    wantsOrders(message) ? orderContext(userId) : Promise.resolve(null),
    getCurrentProduct(currentProductSlug)
  ]);
  const cards = products.map(cardFromProduct);

  if (wantsOrders(message) && !userId) {
    return {
      reply:
        orderData?.reply ??
        "Pra falar de pedido eu preciso que voce esteja logado. Seguranca primeiro, sem furar fila.",
      products: [],
      quickActions: ["ver promocoes", "mais barato", "ir para o carrinho"],
      source: "fallback",
      fallbackReason: "auth_required"
    };
  }

  const context = [
    `Pagina atual: ${pathname ?? "/"}${currentProductSlug ? ` | produto atual ${currentProductSlug}` : ""}`,
    currentProduct ? `Produto em foco:\n${productSummary(currentProduct)}` : "Sem produto em foco.",
    `Produtos relevantes:\n${products.map(productSummary).join("\n") || "Nenhum produto encontrado."}`,
    orderData ? `Pedidos do cliente:\n${orderData.context}` : "Pedidos do cliente: nao consultados.",
    `Historico recente:\n${buildHistory(history)}`
  ].join("\n\n");

  const config = await getChatAssistantConfig();
  const ai = await generateAssistantReply({
    config: {
      primaryProvider: config.primaryProvider,
      fallbackProvider1: config.fallbackProvider1,
      fallbackProvider2: config.fallbackProvider2,
      groqModel: config.groqModel,
      geminiModel: config.geminiModel,
      openRouterModel: config.openRouterModel,
      temperature: config.temperature,
      maxOutputTokens: config.maxOutputTokens,
      assistantMode: config.assistantMode
    },
    message,
    context,
    pathname,
    productFocus: currentProduct ? productSummary(currentProduct) : undefined,
    cardsSummary:
      cards.length > 0
        ? cards
            .slice(0, 4)
            .map((product) => `${product.name} | ${product.price} | estoque ${product.stock} | ${product.url}`)
            .join("\n")
        : "- nenhum produto relevante encontrado"
  });

  if (ai.reply) {
    return {
      reply: ai.reply,
      products: cards,
      quickActions: quickActionsFor(message, cards.length > 0),
      source: "ai"
    };
  }

  return fallbackReply(message, products, cards, orderData, ai.status);
}
