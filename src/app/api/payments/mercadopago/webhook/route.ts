import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { markOrderPaidAndReduceStock } from "@/lib/inventory/stock";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  const signature = request.headers.get("x-signature");

  if (webhookSecret && signature && !signature.includes(webhookSecret)) {
    return NextResponse.json({ error: "Webhook nao autorizado." }, { status: 401 });
  }

  const queryOrderId = new URL(request.url).searchParams.get("order_id");
  const orderId = payload.external_reference ?? payload.orderId ?? queryOrderId;
  const status = payload.status ?? payload.action;

  if (!orderId) {
    return NextResponse.json({ ok: true, ignored: "missing-order" });
  }

  if (status === "approved" || status === "payment.updated" || payload.approved === true) {
    await markOrderPaidAndReduceStock(orderId, {
      providerPaymentId: payload.data?.id ? String(payload.data.id) : payload.id,
      raw: payload as Prisma.InputJsonValue
    });
  }

  return NextResponse.json({ ok: true });
}
