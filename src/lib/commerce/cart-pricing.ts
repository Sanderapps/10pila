import { prisma } from "@/lib/db/prisma";
import { computeCoupon } from "./coupons";

export type ResolvedCartCoupon = {
  code: string;
  discountCents: number;
  effectiveFreightCents: number;
  totalCents: number;
};

export async function resolveCartCoupon(
  userId: string,
  subtotalCents: number,
  freightCents: number
): Promise<ResolvedCartCoupon | null> {
  const [application, orderCount] = await Promise.all([
    prisma.cartCouponApplication.findUnique({
      where: { userId },
      include: { coupon: true }
    }),
    prisma.order.count({ where: { userId } })
  ]);

  if (!application) {
    return null;
  }

  const result = computeCoupon({
    coupon: application.coupon,
    subtotalCents,
    freightCents,
    hasPreviousOrders: orderCount > 0,
    currentUserId: userId
  });

  if (!result.valid) {
    return null;
  }

  return {
    code: application.coupon.code,
    discountCents: result.discountCents,
    effectiveFreightCents: result.effectiveFreightCents,
    totalCents: result.totalCents
  };
}
