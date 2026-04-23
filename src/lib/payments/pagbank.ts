import type { Order, OrderItem, Payment } from "@prisma/client";
import { logError, logInfo, logWarn } from "@/lib/utils/ops-log";

type CheckoutInput = {
  order: Order & { items: OrderItem[]; payment: Payment | null };
};

type PagBankLink = {
  rel?: string;
  href?: string;
  media?: string;
  type?: string;
};

type PagBankCheckoutResponse = {
  id?: string;
  reference_id?: string;
  links?: PagBankLink[];
  error_messages?: Array<{ code?: string; description?: string }>;
};

export async function createPagBankCheckout({ order }: CheckoutInput) {
  const token = process.env.PAGBANK_ACCESS_TOKEN;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const apiUrl = process.env.PAGBANK_API_URL ?? "https://sandbox.api.pagseguro.com";

  if (!token) {
    logWarn("payments.pagbank.token_missing", {
      orderId: order.id
    });
    return {
      checkoutId: `local-${order.id}`,
      checkoutUrl: null,
      raw: {
        mode: "structural",
        provider: "pagbank",
        message: "PAGBANK_ACCESS_TOKEN ausente. Pedido salvo sem redirecionamento real."
      }
    };
  }

  try {
    const response = await fetch(`${apiUrl}/checkouts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        reference_id: order.id,
        customer: {
          name: order.customerName,
          email: order.customerEmail
        },
        items: order.items.map((item) => ({
          reference_id: item.productId,
          name: item.name,
          quantity: item.quantity,
          unit_amount: item.unitCents
        })),
        additional_amount: order.freightCents,
        redirect_url: `${appUrl}/checkout?status=return&pedido=${order.id}`,
        notification_urls: [`${appUrl}/api/payments/pagbank/webhook`],
        payment_methods: [
          { type: "CREDIT_CARD" },
          { type: "DEBIT_CARD" },
          { type: "PIX" },
          { type: "BOLETO" }
        ]
      })
    });

    if (!response.ok) {
      const body = await response.text();
      logWarn("payments.pagbank.checkout_rejected", {
        orderId: order.id,
        status: response.status
      });
      return {
        checkoutId: `pagbank-error-${order.id}`,
        checkoutUrl: null,
        raw: {
          mode: "structural",
          provider: "pagbank",
          message:
            response.status === 401 || response.status === 403
              ? "PagBank recusou autenticacao/autorizacao. Confira token sandbox e liberacao da API."
              : "PagBank recusou a criacao do checkout. Pedido salvo sem redirecionamento real.",
          status: response.status,
          error: body
        }
      };
    }

    const data = (await response.json()) as PagBankCheckoutResponse;
    const checkoutUrl =
      data.links?.find((link) => link.rel === "PAY")?.href ??
      data.links?.find((link) => link.href?.includes("pagseguro"))?.href ??
      null;

    logInfo("payments.pagbank.checkout_created", {
      orderId: order.id,
      checkoutId: data.id ?? `pagbank-${order.id}`,
      hasCheckoutUrl: Boolean(checkoutUrl)
    });

    return {
      checkoutId: data.id ?? `pagbank-${order.id}`,
      checkoutUrl,
      raw: checkoutUrl
        ? data
        : {
            ...data,
            mode: "structural",
            provider: "pagbank",
            message: "PagBank criou resposta sem link PAY. Pedido salvo sem redirecionamento real."
          }
    };
  } catch (error) {
    logError("payments.pagbank.network_error", {
      orderId: order.id,
      message: error instanceof Error ? error.message : "unknown"
    });
    return {
      checkoutId: `pagbank-network-${order.id}`,
      checkoutUrl: null,
      raw: {
        mode: "structural",
        provider: "pagbank",
        message: "PagBank nao respondeu agora. Pedido salvo sem redirecionamento real.",
        error: error instanceof Error ? error.message : "unknown_error"
      }
    };
  }
}
