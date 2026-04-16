import type { Product } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { centsToBRL } from "@/lib/utils/money";
import { generateGeminiReply } from "./gemini";

export type ChatProductCard = {
  id: string;
  name: string;
  slug: string;
  price: string;
  stock: number;
  imageUrl: string;
  url: string;
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
  "o",
  "os",
  "pra",
  "para",
  "produto",
  "quero",
  "sobre",
  "tem",
  "um",
  "uma",
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

function productLine(product: Product) {
  const price = centsToBRL(product.promotionalCents ?? product.priceCents);
  const stock = product.stock > 0 ? `${product.stock} em estoque` : "sem estoque";
  return `${product.name}: ${price}, ${stock}, link ${productUrl(product.slug)}`;
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

function wantsPromos(message: string) {
  return /promo|promoc|desconto|oferta|barato|menor preco/.test(message.toLowerCase());
}

function wantsLink(message: string) {
  return /link|url|pagina|produto/.test(message.toLowerCase());
}

async function relevantProducts(message: string, currentProductSlug?: string) {
  const terms = searchTerms(message);
  const currentProduct = currentProductSlug
    ? await prisma.product.findFirst({ where: { slug: currentProductSlug, active: true } })
    : null;

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
      promotionalCents: wantsPromos(message) ? { not: null } : undefined
    },
    orderBy: wantsPromos(message)
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
      const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
      return { product, score };
    })
    .sort((a, b) => b.score - a.score || Number(b.product.featured) - Number(a.product.featured))
    .forEach(({ product }) => unique.set(product.id, product));

  if (unique.size === 0) {
    const fallback = await prisma.product.findMany({
      where: { active: true },
      orderBy: wantsPromos(message)
        ? [{ promotionalCents: "asc" }, { updatedAt: "desc" }]
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
      context: "Cliente nao esta logado. Nao consulte pedido sem login.",
      reply:
        "Pra consultar pedido eu preciso que voce esteja logado. Segurança primeiro, fofoca de pedido dos outros nao rola."
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
      reply: "Nao achei pedido na sua conta ainda. Carrinho vazio nao farma status, infelizmente."
    };
  }

  const lines = orders.map(
    (order) =>
      `Pedido ${order.id.slice(0, 8)}: ${order.status}, total ${centsToBRL(
        order.totalCents
      )}, itens ${order.items.map((item) => `${item.quantity}x ${item.name}`).join(", ")}`
  );

  return {
    context: lines.join("\n"),
    reply: lines.join("\n")
  };
}

export async function answerFromStoreData(
  message: string,
  userId?: string,
  currentProductSlug?: string
) {
  const products = await relevantProducts(message, currentProductSlug);
  const cards = products.map(cardFromProduct);
  const orderData = wantsOrders(message) ? await orderContext(userId) : null;

  if (wantsOrders(message) && !userId) {
    return {
      reply: orderData?.reply ?? "Faça login para consultar seus pedidos.",
      products: cards,
      quickActions: ["ver promocoes", "mais barato", "ir para o carrinho"],
      source: "fallback" as const
    };
  }

  const productsContext =
    products.length > 0
      ? products.map(productLine).join("\n")
      : "Nenhum produto ativo encontrado para essa consulta.";
  const context = [
    `Produtos relevantes:\n${productsContext}`,
    orderData ? `Pedidos do usuario:\n${orderData.context}` : null,
    currentProductSlug ? `Pagina atual: /produtos/${currentProductSlug}` : null
  ]
    .filter(Boolean)
    .join("\n\n");

  const geminiReply = await generateGeminiReply({ message, context }).catch(() => null);

  if (geminiReply) {
    return {
      reply: geminiReply,
      products: cards,
      quickActions: ["ver detalhes", "comparar", "adicionar ao carrinho", "ir para o carrinho"],
      source: "gemini" as const
    };
  }

  if (wantsOrders(message) && orderData) {
    return {
      reply: orderData.reply,
      products: cards,
      quickActions: ["ver promocoes", "ir para o carrinho"],
      source: "fallback" as const
    };
  }

  if (products.length === 0) {
    return {
      reply: "Ainda nao tem produto ativo batendo com isso. Sem fanfic de estoque por aqui.",
      products: [],
      quickActions: ["ver promocoes", "mais barato"],
      source: "fallback" as const
    };
  }

  const intro = wantsLink(message)
    ? "Link certo, sem caça ao tesouro:"
    : wantsPromos(message)
      ? "Promos reais que achei no banco:"
      : "Achei esses candidatos na fonte da loja:";

  return {
    reply: `${intro}\n${products.map(productLine).join("\n")}`,
    products: cards,
    quickActions: ["ver detalhes", "comparar", "adicionar ao carrinho", "ir para o carrinho"],
    source: "fallback" as const
  };
}
