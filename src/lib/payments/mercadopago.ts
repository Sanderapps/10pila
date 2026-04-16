import type { Order, OrderItem, Payment } from "@prisma/client";

type PreferenceInput = {
  order: Order & { items: OrderItem[]; payment: Payment | null };
};

export async function createMercadoPagoPreference({ order }: PreferenceInput) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!token) {
    return {
      preferenceId: `local-${order.id}`,
      checkoutUrl: null,
      raw: {
        mode: "structural",
        message: "MERCADOPAGO_ACCESS_TOKEN ausente. Pedido salvo sem redirecionamento real."
      }
    };
  }

  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      external_reference: order.id,
      items: order.items.map((item) => ({
        id: item.productId,
        title: item.name,
        quantity: item.quantity,
        unit_price: item.unitCents / 100,
        currency_id: "BRL"
      })),
      shipments: {
        cost: order.freightCents / 100,
        mode: "not_specified"
      },
      payment_methods: {
        excluded_payment_types: [],
        installments: 6
      },
      back_urls: {
        success: `${appUrl}/checkout?status=success&pedido=${order.id}`,
        failure: `${appUrl}/checkout?status=failure&pedido=${order.id}`,
        pending: `${appUrl}/checkout?status=pending&pedido=${order.id}`
      },
      notification_url: `${appUrl}/api/payments/mercadopago/webhook`
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Mercado Pago recusou a preferencia: ${body}`);
  }

  const data = (await response.json()) as {
    id: string;
    init_point?: string;
    sandbox_init_point?: string;
  };

  return {
    preferenceId: data.id,
    checkoutUrl: data.init_point ?? data.sandbox_init_point ?? null,
    raw: data
  };
}
