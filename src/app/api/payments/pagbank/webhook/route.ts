import crypto from "node:crypto";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { markOrderPaidAndReduceStock } from "@/lib/inventory/stock";

function isApprovedStatus(status: unknown) {
  return ["PAID", "APPROVED", "AUTHORIZED", "PAYMENT_RECEIVED", "COMPLETED"].includes(
    String(status ?? "").toUpperCase()
  );
}

function orderIdFromPayload(payload: Record<string, unknown>, requestUrl: string) {
  const url = new URL(requestUrl);
  const charge = Array.isArray(payload.charges) ? payload.charges[0] : undefined;
  const chargeObject =
    charge && typeof charge === "object" ? (charge as Record<string, unknown>) : undefined;
  const dataObject =
    payload.data && typeof payload.data === "object"
      ? (payload.data as Record<string, unknown>)
      : undefined;
  const dataCharge = Array.isArray(dataObject?.charges) ? dataObject.charges[0] : undefined;
  const dataChargeObject =
    dataCharge && typeof dataCharge === "object"
      ? (dataCharge as Record<string, unknown>)
      : undefined;

  return (
    payload.reference_id ??
    payload.order_id ??
    payload.orderId ??
    dataObject?.reference_id ??
    dataObject?.order_id ??
    dataObject?.orderId ??
    chargeObject?.reference_id ??
    dataChargeObject?.reference_id ??
    url.searchParams.get("order_id") ??
    url.searchParams.get("reference_id")
  );
}

function providerPaymentIdFromPayload(payload: Record<string, unknown>) {
  const charge = Array.isArray(payload.charges) ? payload.charges[0] : undefined;
  const chargeObject =
    charge && typeof charge === "object" ? (charge as Record<string, unknown>) : undefined;
  const dataObject =
    payload.data && typeof payload.data === "object"
      ? (payload.data as Record<string, unknown>)
      : undefined;

  return payload.id ?? payload.checkout_id ?? dataObject?.id ?? dataObject?.checkout_id ?? chargeObject?.id;
}

function statusFromPayload(payload: Record<string, unknown>) {
  const charge = Array.isArray(payload.charges) ? payload.charges[0] : undefined;
  const chargeObject =
    charge && typeof charge === "object" ? (charge as Record<string, unknown>) : undefined;
  const dataObject =
    payload.data && typeof payload.data === "object"
      ? (payload.data as Record<string, unknown>)
      : undefined;
  const dataCharge = Array.isArray(dataObject?.charges) ? dataObject.charges[0] : undefined;
  const dataChargeObject =
    dataCharge && typeof dataCharge === "object"
      ? (dataCharge as Record<string, unknown>)
      : undefined;

  return (
    payload.status ??
    payload.event ??
    payload.type ??
    dataObject?.status ??
    dataObject?.event ??
    dataObject?.type ??
    chargeObject?.status ??
    dataChargeObject?.status
  );
}

function hasValidSignature(rawBody: string, signature: string | null, secret: string) {
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const candidates = [
    signature,
    signature?.replace(/^sha256=/i, ""),
    signature?.split(",").find((part) => part.trim().startsWith("sha256="))?.split("=")[1]
  ].filter(Boolean) as string[];

  return candidates.some((candidate) => {
    const expectedBuffer = Buffer.from(expected);
    const candidateBuffer = Buffer.from(candidate);

    return (
      expectedBuffer.length === candidateBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, candidateBuffer)
    );
  });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  let payload: Record<string, unknown>;

  try {
    payload = JSON.parse(rawBody || "{}") as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Payload PagBank invalido." }, { status: 400 });
  }
  const webhookSecret = process.env.PAGBANK_WEBHOOK_SECRET;
  const signature =
    request.headers.get("x-authenticity-token") ??
    request.headers.get("x-pagbank-signature") ??
    request.headers.get("x-signature");

  if (webhookSecret && (!signature || !hasValidSignature(rawBody, signature, webhookSecret))) {
    return NextResponse.json({ error: "Webhook PagBank nao autorizado." }, { status: 401 });
  }

  const orderId = orderIdFromPayload(payload, request.url);

  if (!orderId) {
    return NextResponse.json({ ok: true, ignored: "missing-order" });
  }

  if (isApprovedStatus(statusFromPayload(payload))) {
    try {
      await markOrderPaidAndReduceStock(String(orderId), {
        providerPaymentId: providerPaymentIdFromPayload(payload)
          ? String(providerPaymentIdFromPayload(payload))
          : undefined,
        raw: payload as Prisma.InputJsonValue
      });
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Nao foi possivel processar webhook PagBank."
        },
        { status: 400 }
      );
    }
  }

  return NextResponse.json({ ok: true });
}
