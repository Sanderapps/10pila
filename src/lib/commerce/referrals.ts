import { Prisma, ReferralStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

const REFERRAL_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const REFERRAL_REWARD_CENTS = 1000;
const REFERRAL_MIN_ORDER_CENTS = 5000;
const REFERRAL_REWARD_VALIDITY_DAYS = 30;

function randomToken(length: number) {
  return Array.from({ length }, () =>
    REFERRAL_CODE_ALPHABET[Math.floor(Math.random() * REFERRAL_CODE_ALPHABET.length)]
  ).join("");
}

function normalizeBase(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "")
    .toUpperCase()
    .slice(0, 6);
}

async function createUniqueReferralCode(tx: Prisma.TransactionClient, seed: string) {
  const base = normalizeBase(seed) || "PILA";

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = `${base}${randomToken(4)}`;
    const existing = await tx.user.findUnique({
      where: { referralCode: candidate },
      select: { id: true }
    });

    if (!existing) {
      return candidate;
    }
  }

  return `PILA${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

export async function ensureUserReferralCode(userId: string) {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, referralCode: true }
  });

  if (!existing) {
    throw new Error("Usuario nao encontrado.");
  }

  if (existing.referralCode) {
    return existing.referralCode;
  }

  const code = await prisma.$transaction(async (tx) => {
    const fresh = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, referralCode: true }
    });

    if (!fresh) {
      throw new Error("Usuario nao encontrado.");
    }

    if (fresh.referralCode) {
      return fresh.referralCode;
    }

    const nextCode = await createUniqueReferralCode(tx, fresh.name ?? fresh.email);

    await tx.user.update({
      where: { id: userId },
      data: { referralCode: nextCode }
    });

    return nextCode;
  });

  return code;
}

export async function attachReferralToNewUser(input: {
  userId: string;
  email: string;
  referralCode?: string | null;
}) {
  const normalizedCode = input.referralCode?.trim().toUpperCase();

  if (!normalizedCode) {
    return null;
  }

  return prisma.$transaction(async (tx) => {
    const [user, referrer] = await Promise.all([
      tx.user.findUnique({
        where: { id: input.userId },
        select: { id: true, email: true }
      }),
      tx.user.findUnique({
        where: { referralCode: normalizedCode },
        select: { id: true, email: true }
      })
    ]);

    if (!user || !referrer) {
      return null;
    }

    if (user.id === referrer.id || user.email === referrer.email) {
      return null;
    }

    const existing = await tx.referral.findUnique({
      where: { referredUserId: user.id },
      select: { id: true }
    });

    if (existing) {
      return existing;
    }

    return tx.referral.create({
      data: {
        referrerId: referrer.id,
        referredUserId: user.id,
        referralCodeUsed: normalizedCode,
        status: ReferralStatus.PENDING
      }
    });
  });
}

async function createRewardCoupon(
  tx: Prisma.TransactionClient,
  referrerId: string,
  referralId: string
) {
  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + REFERRAL_REWARD_VALIDITY_DAYS * 24 * 60 * 60 * 1000);

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = `PILA10${randomToken(4)}`;

    try {
      return await tx.coupon.create({
        data: {
          code,
          type: "FIXED",
          value: REFERRAL_REWARD_CENTS,
          minOrderCents: 3000,
          firstPurchaseOnly: false,
          active: true,
          startsAt,
          endsAt,
          assignedUserId: referrerId
        }
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        continue;
      }

      throw error;
    }
  }

  throw new Error(`Nao foi possivel gerar cupom de recompensa para indicacao ${referralId}.`);
}

export async function rewardReferralForPaidOrder(
  tx: Prisma.TransactionClient,
  order: { id: string; userId: string; totalCents: number }
) {
  const referral = await tx.referral.findUnique({
    where: { referredUserId: order.userId },
    include: {
      referrer: {
        select: { id: true, email: true }
      }
    }
  });

  if (!referral || referral.status === ReferralStatus.REWARDED) {
    return null;
  }

  const paidOrdersCount = await tx.order.count({
    where: { userId: order.userId, status: "PAID" }
  });

  if (paidOrdersCount !== 1 || order.totalCents < REFERRAL_MIN_ORDER_CENTS) {
    return null;
  }

  const coupon = await createRewardCoupon(tx, referral.referrerId, referral.id);

  await tx.referral.update({
    where: { id: referral.id },
    data: {
      status: ReferralStatus.REWARDED,
      qualifyingOrderId: order.id,
      qualifiedAt: new Date(),
      rewardedAt: new Date(),
      rewardCouponId: coupon.id
    }
  });

  return {
    referralId: referral.id,
    rewardCouponCode: coupon.code
  };
}

export function buildReferralLink(code: string) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000";

  return `${baseUrl.replace(/\/$/, "")}/auth/register?ref=${encodeURIComponent(code)}`;
}

export const referralRules = {
  rewardCents: REFERRAL_REWARD_CENTS,
  minOrderCents: REFERRAL_MIN_ORDER_CENTS,
  rewardValidityDays: REFERRAL_REWARD_VALIDITY_DAYS
};
