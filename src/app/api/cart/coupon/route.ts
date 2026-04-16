import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { computeCoupon } from "@/lib/commerce/coupons";
import { prisma } from "@/lib/db/prisma";
import { freightCents } from "@/lib/utils/money";

const applySchema = z.object({
  code: z.string().trim().min(2).max(40)
});

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });
  }

  const parsed = applySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Cupom invalido." }, { status: 400 });
  }

  const code = parsed.data.code.toUpperCase();
  const [coupon, cartItems, orderCount] = await Promise.all([
    prisma.coupon.findUnique({ where: { code } }),
    prisma.cartItem.findMany({
      where: { userId: user.id },
      include: { product: true }
    }),
    prisma.order.count({ where: { userId: user.id } })
  ]);

  if (!coupon) {
    return NextResponse.json({ error: "Cupom nao encontrado." }, { status: 404 });
  }

  const subtotalCents = cartItems.reduce((total, item) => {
    const price = item.product.promotionalCents ?? item.product.priceCents;
    return total + price * item.quantity;
  }, 0);

  const result = computeCoupon({
    coupon,
    subtotalCents,
    freightCents: freightCents(),
    hasPreviousOrders: orderCount > 0,
    currentUserId: user.id
  });

  if (!result.valid) {
    return NextResponse.json({ error: result.message ?? "Cupom invalido." }, { status: 400 });
  }

  await prisma.cartCouponApplication.upsert({
    where: { userId: user.id },
    update: { couponId: coupon.id },
    create: { userId: user.id, couponId: coupon.id }
  });

  return NextResponse.json({
    ok: true,
    code: coupon.code,
    discountCents: result.discountCents,
    effectiveFreightCents: result.effectiveFreightCents,
    totalCents: result.totalCents,
    message: "Cupom aplicado no carrinho."
  });
}

export async function DELETE() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });
  }

  await prisma.cartCouponApplication.deleteMany({
    where: { userId: user.id }
  });

  return NextResponse.json({ ok: true });
}
