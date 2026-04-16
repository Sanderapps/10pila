import { prisma } from "@/lib/db/prisma";
import { centsToBRL } from "@/lib/utils/money";

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

    return `Promos reais do banco:\n${promos
      .map((product) => `- ${product.name}: ${centsToBRL(product.promotionalCents ?? product.priceCents)}`)
      .join("\n")}`;
  }

  const products = await prisma.product.findMany({
    where: {
      active: true,
      OR: [
        { name: { contains: message, mode: "insensitive" } },
        { description: { contains: message, mode: "insensitive" } }
      ]
    },
    take: 5
  });

  const fallbackProducts =
    products.length > 0
      ? products
      : await prisma.product.findMany({
          where: { active: true },
          orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
          take: 4
        });

  if (fallbackProducts.length === 0) {
    return "Ainda nao tem produto cadastrado. O estoque ta mais vazio que grupo de deploy sexta-feira.";
  }

  return `Achei isso na fonte da loja:\n${fallbackProducts
    .map((product) => {
      const price = centsToBRL(product.promotionalCents ?? product.priceCents);
      const stock = product.stock > 0 ? `${product.stock} em estoque` : "sem estoque";
      return `- ${product.name}: ${price}, ${stock}.`;
    })
    .join("\n")}\nQuer detalhe de algum deles?`;
}
