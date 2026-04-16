import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { createPagBankCheckout } from "@/lib/payments/pagbank";
import { freightCents } from "@/lib/utils/money";

const addressSchema = z.object({
  recipient: z.string().min(2),
  phone: z.string().min(8),
  zipCode: z.string().min(5),
  street: z.string().min(2),
  number: z.string().min(1),
  complement: z.string().optional(),
  district: z.string().min(2),
  city: z.string().min(2),
  state: z.string().min(2).max(2)
});

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });
  }

  const userEmail = user.email;
  const parsed = addressSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Endereco invalido." }, { status: 400 });
  }

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: user.id },
    include: { product: true }
  });

  if (cartItems.length === 0) {
    return NextResponse.json({ error: "Carrinho vazio." }, { status: 400 });
  }

  for (const item of cartItems) {
    if (!item.product.active || item.product.stock < item.quantity) {
      return NextResponse.json(
        { error: `Estoque indisponivel para ${item.product.name}.` },
        { status: 400 }
      );
    }
  }

  const subtotalCents = cartItems.reduce((total, item) => {
    const price = item.product.promotionalCents ?? item.product.priceCents;
    return total + price * item.quantity;
  }, 0);
  const fixedFreight = freightCents();

  const order = await prisma.$transaction(async (tx) => {
    const address = await tx.address.create({
      data: {
        userId: user.id,
        ...parsed.data
      }
    });

    const savedOrder = await tx.order.create({
      data: {
        userId: user.id,
        addressId: address.id,
        status: "AWAITING_PAYMENT",
        subtotalCents,
        freightCents: fixedFreight,
        totalCents: subtotalCents + fixedFreight,
        customerName: user.name ?? parsed.data.recipient,
        customerEmail: userEmail,
        shippingAddress: parsed.data,
        items: {
          create: cartItems.map((item) => {
            const price = item.product.promotionalCents ?? item.product.priceCents;
            return {
              productId: item.productId,
              name: item.product.name,
              imageUrl: item.product.imageUrl,
              unitCents: price,
              quantity: item.quantity,
              totalCents: price * item.quantity
            };
          })
        },
        payment: {
          create: {
            provider: "pagbank",
            status: "PENDING",
            amountCents: subtotalCents + fixedFreight
          }
        }
      },
      include: { items: true, payment: true }
    });

    await tx.cartItem.deleteMany({ where: { userId: user.id } });

    return savedOrder;
  });

  const checkout = await createPagBankCheckout({ order });

  await prisma.payment.update({
    where: { orderId: order.id },
    data: {
      preferenceId: checkout.checkoutId,
      checkoutUrl: checkout.checkoutUrl,
      raw: checkout.raw
    }
  });

  return NextResponse.json({
    orderId: order.id,
    checkoutUrl: checkout.checkoutUrl
  });
}
