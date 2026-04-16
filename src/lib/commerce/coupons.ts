import { Coupon, CouponType } from "@prisma/client";

type CouponValidationInput = {
  coupon: Coupon;
  subtotalCents: number;
  freightCents: number;
  hasPreviousOrders: boolean;
  currentUserId?: string;
};

export type CouponComputation = {
  valid: boolean;
  message?: string;
  productDiscountCents: number;
  freightDiscountCents: number;
  discountCents: number;
  effectiveFreightCents: number;
  totalCents: number;
};

export function computeCoupon({
  coupon,
  subtotalCents,
  freightCents,
  hasPreviousOrders,
  currentUserId
}: CouponValidationInput): CouponComputation {
  const now = new Date();

  if (coupon.assignedUserId && coupon.assignedUserId !== currentUserId) {
    return invalid("Esse cupom esta vinculado a outra conta.", subtotalCents, freightCents);
  }

  if (!coupon.active) {
    return invalid("Cupom inativo.", subtotalCents, freightCents);
  }

  if (coupon.startsAt && coupon.startsAt > now) {
    return invalid("Cupom ainda nao liberado.", subtotalCents, freightCents);
  }

  if (coupon.endsAt && coupon.endsAt < now) {
    return invalid("Cupom expirado.", subtotalCents, freightCents);
  }

  if (coupon.minOrderCents && subtotalCents < coupon.minOrderCents) {
    return invalid("Subtotal abaixo do minimo para esse cupom.", subtotalCents, freightCents);
  }

  if (coupon.firstPurchaseOnly && hasPreviousOrders) {
    return invalid("Esse cupom vale so na primeira compra.", subtotalCents, freightCents);
  }

  let productDiscountCents = 0;
  let freightDiscountCents = 0;
  let effectiveFreightCents = freightCents;

  if (coupon.type === CouponType.PERCENT) {
    if (!coupon.value || coupon.value <= 0) {
      return invalid("Cupom percentual invalido.", subtotalCents, freightCents);
    }

    productDiscountCents = Math.floor((subtotalCents * coupon.value) / 100);
  }

  if (coupon.type === CouponType.FIXED) {
    if (!coupon.value || coupon.value <= 0) {
      return invalid("Cupom fixo invalido.", subtotalCents, freightCents);
    }

    productDiscountCents = Math.min(coupon.value, subtotalCents);
  }

  if (coupon.type === CouponType.FREE_SHIPPING) {
    freightDiscountCents = Math.min(freightCents, Math.max(freightCents, 0));
    effectiveFreightCents = Math.max(freightCents - freightDiscountCents, 0);
  }

  const discountCents = productDiscountCents + freightDiscountCents;
  const totalCents = Math.max(subtotalCents - productDiscountCents + effectiveFreightCents, 0);

  return {
    valid: true,
    productDiscountCents,
    freightDiscountCents,
    discountCents,
    effectiveFreightCents,
    totalCents
  };
}

function invalid(message: string, subtotalCents: number, freightCents: number): CouponComputation {
  return {
    valid: false,
    message,
    productDiscountCents: 0,
    freightDiscountCents: 0,
    discountCents: 0,
    effectiveFreightCents: freightCents,
    totalCents: subtotalCents + freightCents
  };
}
