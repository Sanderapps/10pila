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
  replyChunks: string[];
  products: ChatProductCard[];
  quickActions: string[];
  typingStatus: string;
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

type ChatIntent =
  | "order"
  | "greeting"
  | "browsing"
  | "chat"
  | "recommendation"
  | "promotion"
  | "cheaper"
  | "link"
  | "compare"
  | "details"
  | "similar"
  | "add_to_cart"
  | "specific_item"
  | "unknown";

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

function wantsSpecificItem(message: string) {
  return /quero|preciso|procuro|to buscando|t[oô] buscando|tem algum|me mostra/.test(
    message.toLowerCase()
  );
}

function wantsExchangePolicy(message: string) {
  return /troca|devolu|devolver|reembolso|garantia|politica/.test(message.toLowerCase());
}

function wantsVoltageInfo(message: string) {
  return /voltag|110|220|bivolt|energia|tomada/.test(message.toLowerCase());
}

function wantsShippingInfo(message: string) {
  return /frete|entrega|prazo/.test(message.toLowerCase());
}

function wantsFloodyTone(history?: ChatHistoryMessage[]) {
  if (!history || history.length < 3) {
    return false;
  }

  const recentUserMessages = history.filter((entry) => entry.role === "user").slice(-3);
  if (recentUserMessages.length < 3) {
    return false;
  }

  return recentUserMessages.every((entry) => entry.content.trim().length <= 14);
}

function repeatedIntentCount(message: string, history?: ChatHistoryMessage[]) {
  if (!history || history.length === 0) {
    return 0;
  }

  const currentIntent = detectIntent(message);
  const currentTerms = searchTerms(message).slice(0, 4).join(" ");

  return history
    .filter((entry) => entry.role === "user")
    .slice(-5)
    .reduce((total, entry) => {
      const sameIntent = detectIntent(entry.content) === currentIntent;
      const comparedTerms = searchTerms(entry.content).slice(0, 4).join(" ");
      const sameTerms =
        (comparedTerms.length > 0 ? comparedTerms : entry.content.trim().toLowerCase()) ===
        (currentTerms.length > 0 ? currentTerms : message.trim().toLowerCase());
      return total + Number(sameIntent && sameTerms);
    }, 0);
}

function findSpecificationValue(specifications: Product["specifications"] | undefined, keys: string[]) {
  if (!specifications || typeof specifications !== "object" || Array.isArray(specifications)) {
    return null;
  }

  const entries = Object.entries(specifications as Record<string, unknown>);

  for (const [key, value] of entries) {
    const normalizedKey = key
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (keys.some((candidate) => normalizedKey.includes(candidate))) {
      if (typeof value === "string" || typeof value === "number") {
        return String(value);
      }
    }
  }

  return null;
}

function splitReplyIntoChunks(reply: string) {
  const lines = reply
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length > 1) {
    return lines;
  }

  return reply
    .split(/(?<=[.!?])\s+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

function typingStatusFor(intent: ChatIntent, hasProducts: boolean) {
  if (intent === "compare") {
    return "comparando os dois";
  }

  if (intent === "order" || intent === "add_to_cart") {
    return "vendo no sistema";
  }

  if (hasProducts || intent === "specific_item" || intent === "details" || intent === "similar") {
    return "vendo no sistema";
  }

  if (intent === "chat" || intent === "greeting") {
    return "aguardando você decidir";
  }

  return "vendo no sistema";
}

function buildReplyChunks(
  reply: string,
  intent: ChatIntent,
  hasProducts: boolean
) {
  const contentChunks = splitReplyIntoChunks(reply).slice(0, 3);

  if (contentChunks.length <= 1 && reply.length <= 72) {
    return [reply];
  }

  if (
    hasProducts ||
    intent === "specific_item" ||
    intent === "compare" ||
    intent === "details" ||
    intent === "similar" ||
    intent === "cheaper" ||
    intent === "promotion"
  ) {
    const lead = hasProducts ? "Pera, tô vendo." : "Pera.";
    const chunks = [lead, ...contentChunks];
    return chunks.slice(0, 3);
  }

  return contentChunks.slice(0, 3);
}

function withPresentation(answer: Omit<ChatAnswer, "replyChunks" | "typingStatus">, intent: ChatIntent) {
  return {
    ...answer,
    replyChunks: buildReplyChunks(answer.reply, intent, answer.products.length > 0),
    typingStatus: typingStatusFor(intent, answer.products.length > 0)
  };
}

function isCasualConversation(message: string) {
  return isGreeting(message) || isJustBrowsing(message) || wantsChat(message);
}

function detectIntent(message: string): ChatIntent {
  if (wantsOrders(message)) {
    return "order";
  }

  if (wantsAddToCart(message)) {
    return "add_to_cart";
  }

  if (wantsLink(message)) {
    return "link";
  }

  if (wantsCompare(message)) {
    return "compare";
  }

  if (wantsDetails(message)) {
    return "details";
  }

  if (wantsSimilar(message)) {
    return "similar";
  }

  if (wantsCheaper(message)) {
    return "cheaper";
  }

  if (wantsPromos(message)) {
    return "promotion";
  }

  if (wantsRecommendation(message)) {
    return "recommendation";
  }

  if (wantsSpecificItem(message)) {
    return "specific_item";
  }

  if (isJustBrowsing(message)) {
    return "browsing";
  }

  if (wantsChat(message)) {
    return "chat";
  }

  if (isGreeting(message)) {
    return "greeting";
  }

  return "unknown";
}

function wantsProductSuggestionsNow(message: string) {
  return (
    wantsLink(message) ||
    wantsCompare(message) ||
    wantsDetails(message) ||
    wantsSimilar(message) ||
    wantsAddToCart(message) ||
    wantsCheaper(message) ||
    wantsPromos(message)
  );
}

function shouldShowCards(message: string, pathname?: string) {
  if (isCasualConversation(message)) {
    return false;
  }

  if (wantsOrders(message)) {
    return false;
  }

  if (wantsRecommendation(message) && searchTerms(message).length <= 1) {
    return false;
  }

  if (wantsProductSuggestionsNow(message)) {
    return true;
  }

  if (wantsSpecificItem(message) && searchTerms(message).length > 0) {
    return true;
  }

  if (pathname?.startsWith("/produtos/") && searchTerms(message).length > 0) {
    return true;
  }

  return false;
}

function quickActionsFor(
  message: string,
  hasProducts: boolean,
  pathname?: string
) {
  const actions = new Set<string>();
  const intent = detectIntent(message);

  if (intent === "greeting" || intent === "browsing" || intent === "chat") {
    if (pathname?.startsWith("/produtos/")) {
      actions.add("adicionar 1 ao carrinho");
      actions.add("ver detalhes");
      actions.add("comparar");
    } else {
      actions.add("mais barato");
      actions.add("ver promocoes");
      actions.add("achar algo util");
    }

    return Array.from(actions).slice(0, 4);
  }

  if (hasProducts) {
    if (intent === "details") {
      actions.add("ver detalhes");
    }
    if (intent === "compare" || intent === "similar") {
      actions.add("comparar");
    }
    if (intent === "add_to_cart") {
      actions.add("adicionar 1 ao carrinho");
    }
    actions.add("ver detalhes");
    actions.add("comparar");
    actions.add("adicionar 1 ao carrinho");
  }

  if (intent === "order") {
    actions.add("acompanhar pedido");
    actions.add("ir para o carrinho");
  } else {
    actions.add("mais barato");
    actions.add("ver promocoes");
  }

  return Array.from(actions).slice(0, 4);
}

function conversationalReply(message: string) {
  const intent = detectIntent(message);

  if (intent === "greeting") {
    return "Oi. Vai querer produto, comparacao ou so apertar tecla?";
  }

  if (intent === "browsing") {
    return "Beleza. Olha logo. Se cansar de rodar em circulo, eu puxo os mais baratos.";
  }

  if (intent === "chat") {
    return "Posso falar, mas ideal mesmo era isso virar compra.";
  }

  if (intent === "recommendation") {
    return "Posso. Mas me da um minimo util: celular, mesa, organizacao, limpeza ou o menos caro.";
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
        "Pra consultar pedido eu preciso do login. Milagre eu ainda nao faco."
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
      reply: "Nao achei pedido na sua conta. Ate agora ficou so na vontade."
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
  providerStatus: AIReplyStatus,
  pathname?: string,
  currentProduct?: Product | null,
  history?: ChatHistoryMessage[]
): ChatAnswer {
  const intent = detectIntent(message);
  const fallbackReason: ChatAnswer["fallbackReason"] =
    providerStatus === "provider_error"
      ? "provider_error"
      : providerStatus === "missing_provider"
        ? "missing_provider"
        : "deterministic";

  const smallTalk = conversationalReply(message);

  if (smallTalk) {
    return withPresentation({
      reply: smallTalk,
      products: [],
      quickActions: quickActionsFor(message, false, pathname),
      source: "fallback",
      fallbackReason
    }, intent);
  }

  if (wantsFloodyTone(history)) {
    return withPresentation({
      reply: "Calma. Manda uma coisa de cada vez.",
      products: [],
      quickActions: quickActionsFor(message, false, pathname),
      source: "fallback",
      fallbackReason: "deterministic"
    }, intent);
  }

  if (wantsExchangePolicy(message)) {
    return withPresentation({
      reply: `Regras no rodapé. [Lê lá](${appUrl()}/terms)`,
      products: [],
      quickActions: ["ver regras", "ver promocoes"],
      source: "fallback",
      fallbackReason: "deterministic"
    }, intent);
  }

  if (wantsVoltageInfo(message) && pathname?.startsWith("/produtos/")) {
    const voltage = findSpecificationValue(currentProduct?.specifications, ["voltag", "bivolt", "voltage"]);
    return withPresentation({
      reply: voltage ? `${voltage}. Tá na ficha técnica.` : "Tá na ficha técnica, embaixo da foto do produto.",
      products: [],
      quickActions: ["ver detalhes", "comparar"],
      source: "fallback",
      fallbackReason: "deterministic"
    }, intent);
  }

  if (wantsShippingInfo(message) && (pathname?.startsWith("/carrinho") || pathname?.startsWith("/checkout"))) {
    return withPresentation({
      reply: "Frete você confere na próxima etapa.",
      products: [],
      quickActions: ["tirar duvida de entrega", "fechar pedido"],
      source: "fallback",
      fallbackReason: "deterministic"
    }, intent);
  }

  if (intent === "order" && orderData) {
    return withPresentation({
      reply: orderData.reply,
      products: [],
      quickActions: ["acompanhar pedido", "ver promocoes", "ir para o carrinho"],
      source: "fallback",
      fallbackReason: orderData.context.includes("nao esta logado") ? "auth_required" : "deterministic"
    }, intent);
  }

  if (products.length === 0) {
    return withPresentation({
      reply:
        "Nao achei nada que bata direito com isso. Fala nome, categoria ou uso real e eu procuro sem palpite torto.",
      products: [],
      quickActions: ["ver promocoes", "mais barato"],
      source: "fallback",
      fallbackReason: "no_product_match"
    }, intent);
  }

  if (intent === "link") {
    const first = products[0];
    return withPresentation({
      reply: `[${first.name}](${productUrl(first.slug)})\n${centsToBRL(first.promotionalCents ?? first.priceCents)} | estoque ${first.stock}.`,
      products: cards.slice(0, 1),
      quickActions: quickActionsFor(message, cards.length > 0, pathname),
      source: "fallback",
      fallbackReason
    }, intent);
  }

  if (intent === "recommendation" && products.length > 0 && searchTerms(message).length <= 1) {
    return withPresentation({
      reply:
        "Posso recomendar, mas faz tua parte: quer algo util, curioso ou so o menor estrago possivel no preco?",
      products: [],
      quickActions: ["mais barato", "achar algo util", "comparar"],
      source: "fallback",
      fallbackReason
    }, intent);
  }

  const lines = products.map((product) => {
    const price = centsToBRL(product.promotionalCents ?? product.priceCents);
    return `${product.name} | ${price} | estoque ${product.stock} | [Ver produto](${productUrl(
      product.slug
    )})`;
  });

  return withPresentation({
    reply: `${intent === "cheaper" ? "Ta. Puxei o que menos machuca o bolso no estoque real:" : intent === "promotion" ? "Ta. Separei o que ta com cara mais comercial no estoque atual:" : "Achei isso aqui no estoque real. Nao e bonito, mas vende:"}\n${lines.join("\n")}`,
    products: shouldShowCards(message, pathname) ? cards : [],
    quickActions: quickActionsFor(message, cards.length > 0, pathname),
    source: "fallback",
    fallbackReason
  }, intent);
}

export async function answerFromStoreData({
  message,
  userId,
  currentProductSlug,
  pathname,
  history
}: AnswerInput): Promise<ChatAnswer> {
  const intent = detectIntent(message);
  const [products, orderData, currentProduct] = await Promise.all([
    relevantProducts(message, currentProductSlug),
    wantsOrders(message) ? orderContext(userId) : Promise.resolve(null),
    getCurrentProduct(currentProductSlug)
  ]);
  const cards = products.map(cardFromProduct);
  const cardsAllowed = shouldShowCards(message, pathname);
  const smallTalk = conversationalReply(message);

  if (smallTalk) {
    return withPresentation({
      reply: smallTalk,
      products: [],
      quickActions: quickActionsFor(message, false, pathname),
      source: "fallback",
      fallbackReason: "deterministic"
    }, intent);
  }

  if (wantsFloodyTone(history)) {
    return withPresentation({
      reply: "Calma. Manda uma coisa de cada vez.",
      products: [],
      quickActions: quickActionsFor(message, false, pathname),
      source: "fallback",
      fallbackReason: "deterministic"
    }, intent);
  }

  if (repeatedIntentCount(message, history) >= 2) {
    return withPresentation({
      reply: "Já te mandei isso aí em cima. Dá uma olhada.",
      products: [],
      quickActions: quickActionsFor(message, false, pathname),
      source: "fallback",
      fallbackReason: "deterministic"
    }, intent);
  }

  if (intent === "order" && !userId) {
    return withPresentation({
      reply:
        orderData?.reply ??
        "Pra falar de pedido eu preciso que voce esteja logado. Nao vou adivinhar compra alheia.",
      products: [],
      quickActions: ["ver promocoes", "mais barato", "ir para o carrinho"],
      source: "fallback",
      fallbackReason: "auth_required"
    }, intent);
  }

  if (wantsExchangePolicy(message)) {
    return withPresentation({
      reply: `Regras no rodapé. [Lê lá](${appUrl()}/terms)`,
      products: [],
      quickActions: ["ver regras", "ver promocoes"],
      source: "fallback",
      fallbackReason: "deterministic"
    }, intent);
  }

  if (wantsVoltageInfo(message) && pathname?.startsWith("/produtos/")) {
    const voltage = findSpecificationValue(currentProduct?.specifications, ["voltag", "bivolt", "voltage"]);
    return withPresentation({
      reply: voltage ? `${voltage}. Tá na ficha técnica.` : "Tá na ficha técnica, embaixo da foto do produto.",
      products: [],
      quickActions: ["ver detalhes", "comparar"],
      source: "fallback",
      fallbackReason: "deterministic"
    }, intent);
  }

  if (wantsShippingInfo(message) && (pathname?.startsWith("/carrinho") || pathname?.startsWith("/checkout"))) {
    return withPresentation({
      reply: "Frete você confere na próxima etapa.",
      products: [],
      quickActions: ["tirar duvida de entrega", "fechar pedido"],
      source: "fallback",
      fallbackReason: "deterministic"
    }, intent);
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
    return withPresentation({
      reply: ai.reply,
      products: cardsAllowed ? cards : [],
      quickActions: quickActionsFor(message, cards.length > 0, pathname),
      source: "ai"
    }, intent);
  }

  return fallbackReply(message, products, cards, orderData, ai.status, pathname, currentProduct, history);
}
