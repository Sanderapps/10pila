import { Coupon } from "@prisma/client";
import { computeCoupon } from "./coupons";
import { prisma } from "@/lib/db/prisma";
import { resolveFreightOffer } from "./freight-offers";

export type ResolvedCartPricing = {
  code: string | null;
  productDiscountCents: number;
  freightDiscountCents: number;
  discountCents: number;
  effectiveFreightCents: number;
  totalCents: number;
  freightCampaignDiscountCents: number;
  freightCampaignLabel: string | null;
  freightCampaignMessage: string | null;
  freightCampaignActive: boolean;
};

type PricingInput = {
  subtotalCents: number,
  freightCents: number;
  coupon?: Coupon | null;
  currentUserId?: string;
  hasPreviousOrders?: boolean;
};

export function resolvePricingWithCoupon({
  subtotalCents,
  freightCents,
  coupon,
  currentUserId,
  hasPreviousOrders = false
}: PricingInput): ResolvedCartPricing {
  const freightOffer = resolveFreightOffer(freightCents);
  const couponResult = coupon
    ? computeCoupon({
        coupon,
        subtotalCents,
        freightCents: freightOffer.effectiveFreightCents,
        hasPreviousOrders,
        currentUserId
      })
    : null;
  const validCouponResult = coupon && couponResult?.valid ? couponResult : null;
  const validCoupon = coupon && validCouponResult ? coupon : null;
  const productDiscountCents = validCouponResult ? validCouponResult.productDiscountCents : 0;
  const couponFreightDiscountCents = validCouponResult ? validCouponResult.freightDiscountCents : 0;
  const freightDiscountCents = freightOffer.freightDiscountCents + couponFreightDiscountCents;
  const effectiveFreightCents = validCouponResult
    ? validCouponResult.effectiveFreightCents
    : freightOffer.effectiveFreightCents;
  const discountCents = productDiscountCents + freightDiscountCents;
  const totalCents = Math.max(subtotalCents - productDiscountCents + effectiveFreightCents, 0);

  return {
    code: validCoupon?.code ?? null,
    productDiscountCents,
    freightDiscountCents,
    discountCents,
    effectiveFreightCents,
    totalCents,
    freightCampaignDiscountCents: freightOffer.freightDiscountCents,
    freightCampaignLabel: freightOffer.campaignLabel,
    freightCampaignMessage: freightOffer.campaignMessage,
    freightCampaignActive: freightOffer.isActive
  };
}

export async function resolveCartPricing(
  userId: string,
  subtotalCents: number,
  freightCents: number
): Promise<ResolvedCartPricing> {
  const [application, orderCount] = await Promise.all([
    prisma.cartCouponApplication.findUnique({
      where: { userId },
      include: { coupon: true }
    }),
    prisma.order.count({
      where: { userId, status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] } }
    })
  ]);

  return resolvePricingWithCoupon({
    subtotalCents,
    freightCents,
    coupon: application?.coupon ?? null,
    currentUserId: userId,
    hasPreviousOrders: orderCount > 0
  });
}
