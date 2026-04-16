import { prisma } from "@/lib/db/prisma";
import { centsToBRL } from "@/lib/utils/money";

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

function productUrl(slug: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${appUrl.replace(/\/$/, "")}/produtos/${slug}`;
}

function productLine(product: {
  name: string;
  slug: string;
  priceCents: number;
  promotionalCents: number | null;
  stock: number;
}) {
  const price = centsToBRL(product.promotionalCents ?? product.priceCents);
  const stock = product.stock > 0 ? `${product.stock} em estoque` : "sem estoque";
  return `- ${product.name}: ${price}, ${stock}. Link: ${productUrl(product.slug)}`;
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

export async function answerFromStoreData(message: string, userId?: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("pedido")) {
    if (!userId) {
      return "Pra consultar pedido eu preciso que voce esteja logado. Segurança primeiro, fofoca de pedido dos outros nao rola.";
    }

    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { items: true }
    });

    if (orders.length === 0) {
      return "Nao achei pedido na sua conta ainda. Carrinho vazio nao farma status, infelizmente.";
    }

    return orders
      .map(
        (order) =>
          `Pedido ${order.id.slice(0, 8)}: ${order.status}, total ${centsToBRL(
            order.totalCents
          )}, itens: ${order.items.map((item) => `${item.quantity}x ${item.name}`).join(", ")}.`
      )
      .join("\n");
  }

  if (normalized.includes("promo") || normalized.includes("desconto")) {
    const promos = await prisma.product.findMany({
      where: { active: true, promotionalCents: { not: null } },
      orderBy: { updatedAt: "desc" },
      take: 5
    });

    if (promos.length === 0) {
      return "No momento nao achei promo ativa no banco. Sem cupom imaginario, sem fanfic.";
    }

    return `Promos reais, sem desconto freestyle:\n${promos.map(productLine).join("\n")}`;
  }

  const terms = searchTerms(message);
  const products = await prisma.product.findMany({
    where: {
      active: true,
      OR:
        terms.length > 0
          ? terms.flatMap((term) => [
              { name: { contains: term, mode: "insensitive" as const } },
              { description: { contains: term, mode: "insensitive" as const } },
              { slug: { contains: term, mode: "insensitive" as const } }
            ])
          : [
              { name: { contains: message, mode: "insensitive" } },
              { description: { contains: message, mode: "insensitive" } }
            ]
    },
    take: 12
  });

  const rankedProducts = products
    .map((product) => {
      const haystack = `${product.name} ${product.description} ${product.slug}`.toLowerCase();
      const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
      return { product, score };
    })
    .sort((a, b) => b.score - a.score || Number(b.product.featured) - Number(a.product.featured))
    .slice(0, 5)
    .map(({ product }) => product);

  const fallbackProducts =
    rankedProducts.length > 0
      ? rankedProducts
      : await prisma.product.findMany({
          where: { active: true },
          orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
          take: 4
        });

  if (fallbackProducts.length === 0) {
    return "Ainda nao tem produto cadastrado. O estoque ta mais vazio que grupo de deploy sexta-feira.";
  }

  const intro =
    rankedProducts.length > 0
      ? "Achei isso na fonte da loja:"
      : "Nao achei esse termo cravado, mas esses aqui tao no radar do setup:";

  return `${intro}\n${fallbackProducts.map(productLine).join("\n")}\nQuer que eu te mande direto no carrinho mental qual combina mais?`;
}
