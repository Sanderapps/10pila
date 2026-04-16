import { Prisma } from "@prisma/client";
import { rewardReferralForPaidOrder } from "@/lib/commerce/referrals";
import { prisma } from "@/lib/db/prisma";

export async function markOrderPaidAndReduceStock(
  orderId: string,
  paymentData?: {
    providerPaymentId?: string;
    raw?: Prisma.InputJsonValue;
  }
) {
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({
      where: { id: orderId, status: { not: "PAID" } },
      data: { status: "PAID" }
    });

    if (claimed.count === 0) {
      return { changed: false };
    }

    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!order) {
      throw new Error("Pedido nao encontrado.");
    }

    for (const item of order.items) {
      const product = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } }
      });

      if (product.count !== 1) {
        throw new Error(`Estoque insuficiente para ${item.name}`);
      }

      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          type: "SALE",
          quantity: -item.quantity,
          note: `Pedido ${order.id}`
        }
      });
    }

    await tx.payment.updateMany({
      where: { orderId },
      data: {
        status: "APPROVED",
        providerPaymentId: paymentData?.providerPaymentId,
        raw: paymentData?.raw
      }
    });

    await rewardReferralForPaidOrder(tx, {
      id: order.id,
      userId: order.userId,
      totalCents: order.totalCents
    });

    return { changed: true };
  });
}

export async function adjustStock(productId: string, quantity: number, note?: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { stock: true }
  });

  if (!product) {
    throw new Error("Produto nao encontrado.");
  }

  if (product.stock + quantity < 0) {
    throw new Error("Ajuste deixaria estoque negativo.");
  }

  return prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: { stock: { increment: quantity } }
    }),
    prisma.inventoryMovement.create({
      data: {
        productId,
        type: "ADJUSTMENT",
        quantity,
        note
      }
    })
  ]);
}
