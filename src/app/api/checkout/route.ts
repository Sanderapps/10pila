import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { computeCoupon } from "@/lib/commerce/coupons";
import { prisma } from "@/lib/db/prisma";
import { createPagBankCheckout } from "@/lib/payments/pagbank";
import { logError, logInfo, logWarn } from "@/lib/utils/ops-log";
import { freightCents } from "@/lib/utils/money";

const addressSchema = z.object({
  addressId: z.string().cuid().optional(),
  saveAsDefault: z.boolean().optional(),
  recipient: z.string().trim().min(2, "Informe quem vai receber o pedido."),
  phone: z.string().trim().min(8, "Informe um telefone com DDD."),
  zipCode: z.string().trim().min(8, "Informe um CEP valido."),
  street: z.string().trim().min(2, "Informe a rua."),
  number: z.string().trim().min(1, "Informe o numero."),
  complement: z.string().optional(),
  district: z.string().trim().min(2, "Informe o bairro."),
  city: z.string().trim().min(2, "Informe a cidade."),
  state: z.string().trim().length(2, "Use a UF com 2 letras.")
});

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user?.email) {
    logWarn("checkout.auth_required");
    return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });
  }

  const userEmail = user.email;
  const payload = await request.json();
  const parsed = addressSchema.safeParse(payload);

  if (!parsed.success) {
    logWarn("checkout.invalid_payload", {
      userId: user.id,
      issueCount: parsed.error.issues.length
    });
    const fieldErrors = Object.fromEntries(
      parsed.error.issues.map((issue) => [issue.path.join("."), issue.message])
    );

    return NextResponse.json(
      { error: "Revise os dados de entrega.", fieldErrors },
      { status: 400 }
    );
  }

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: user.id },
    include: { product: true }
  });

  if (cartItems.length === 0) {
    logWarn("checkout.cart_empty", { userId: user.id });
    return NextResponse.json({ error: "Carrinho vazio." }, { status: 400 });
  }

  for (const item of cartItems) {
    if (!item.product.active || item.product.stock < item.quantity) {
      logWarn("checkout.stock_conflict", {
        userId: user.id,
        productId: item.productId,
        productName: item.product.name,
        requestedQuantity: item.quantity,
        availableStock: item.product.stock
      });
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
  const [couponApplication, orderCount] = await Promise.all([
    prisma.cartCouponApplication.findUnique({
      where: { userId: user.id },
      include: { coupon: true }
    }),
    prisma.order.count({
      where: { userId: user.id, status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] } }
    })
  ]);
  const couponResult = couponApplication
    ? computeCoupon({
        coupon: couponApplication.coupon,
        subtotalCents,
        freightCents: fixedFreight,
        hasPreviousOrders: orderCount > 0,
        currentUserId: user.id
      })
    : null;
  const effectiveFreightCents =
    couponApplication && couponResult?.valid ? couponResult.effectiveFreightCents : fixedFreight;
  const productDiscountCents =
    couponApplication && couponResult?.valid ? couponResult.productDiscountCents : 0;
  const freightDiscountCents =
    couponApplication && couponResult?.valid ? couponResult.freightDiscountCents : 0;
  const discountCents =
    couponApplication && couponResult?.valid ? couponResult.discountCents : 0;
  const totalCents =
    couponApplication && couponResult?.valid
      ? couponResult.totalCents
      : subtotalCents + fixedFreight;
  const addressInput = {
    recipient: parsed.data.recipient.trim(),
    phone: parsed.data.phone.trim(),
    zipCode: parsed.data.zipCode.trim(),
    street: parsed.data.street.trim(),
    number: parsed.data.number.trim(),
    complement: parsed.data.complement?.trim() || undefined,
    district: parsed.data.district.trim(),
    city: parsed.data.city.trim(),
    state: parsed.data.state.trim().toUpperCase()
  };

  let order;

  try {
    order = await prisma.$transaction(async (tx) => {
      const existingAddressCount = await tx.address.count({
        where: { userId: user.id }
      });
      const shouldBeDefault = parsed.data.saveAsDefault ?? existingAddressCount === 0;

      let address;

      if (parsed.data.addressId) {
        address = await tx.address.findFirst({
          where: {
            id: parsed.data.addressId,
            userId: user.id
          }
        });

        if (!address) {
          throw new Error("Endereco salvo nao encontrado.");
        }

        if (shouldBeDefault) {
          await tx.address.updateMany({
            where: { userId: user.id, id: { not: address.id } },
            data: { isDefault: false }
          });
        }

        address = await tx.address.update({
          where: { id: address.id },
          data: {
            ...addressInput,
            isDefault: shouldBeDefault ? true : address.isDefault
          }
        });
      } else {
        if (shouldBeDefault) {
          await tx.address.updateMany({
            where: { userId: user.id },
            data: { isDefault: false }
          });
        }

        address = await tx.address.create({
          data: {
            userId: user.id,
            isDefault: shouldBeDefault,
            ...addressInput
          }
        });
      }

      const hasDefaultAddress = await tx.address.count({
        where: { userId: user.id, isDefault: true }
      });

      if (hasDefaultAddress === 0) {
        await tx.address.update({
          where: { id: address.id },
          data: { isDefault: true }
        });
      }

      const savedOrder = await tx.order.create({
        data: {
          userId: user.id,
          addressId: address.id,
          status: "AWAITING_PAYMENT",
          couponCode:
            couponApplication && couponResult?.valid ? couponApplication.coupon.code : undefined,
          subtotalCents,
          productDiscountCents,
          freightDiscountCents,
          discountCents,
          freightCents: effectiveFreightCents,
          totalCents,
          customerName: user.name ?? parsed.data.recipient,
          customerEmail: userEmail,
          shippingAddress: addressInput,
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
              amountCents: totalCents
            }
          }
        },
        include: { items: true, payment: true }
      });

      await tx.cartItem.deleteMany({ where: { userId: user.id } });
      await tx.cartCouponApplication.deleteMany({ where: { userId: user.id } });

      return savedOrder;
    });
  } catch (error) {
    logError("checkout.order_transaction_failed", {
      userId: user.id,
      message: error instanceof Error ? error.message : "unknown"
    });
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Nao foi possivel salvar o endereco agora."
      },
      { status: 400 }
    );
  }

  const checkout = await createPagBankCheckout({ order });

  logInfo("checkout.order_created", {
    userId: user.id,
    orderId: order.id,
    subtotalCents,
    totalCents,
    couponCode:
      couponApplication && couponResult?.valid ? couponApplication.coupon.code : null,
    productDiscountCents,
    freightDiscountCents,
    checkoutMode:
      checkout.raw && typeof checkout.raw === "object" && "mode" in checkout.raw
        ? String(checkout.raw.mode)
        : "provider",
    hasCheckoutUrl: Boolean(checkout.checkoutUrl)
  });

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
    checkoutUrl: checkout.checkoutUrl,
    checkoutMessage:
      checkout.raw && typeof checkout.raw === "object" && "message" in checkout.raw
        ? String(checkout.raw.message)
        : undefined
  });
}
