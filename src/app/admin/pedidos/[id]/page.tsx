import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusForm } from "@/components/admin-forms";
import { ShieldIcon, TruckIcon } from "@/components/icons";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { centsToBRL } from "@/lib/utils/money";

export const dynamic = "force-dynamic";

function statusMeta(status: string) {
  switch (status) {
    case "DELIVERED":
      return { label: "Entregue", tone: "text-[var(--accent)]" };
    case "SHIPPED":
      return { label: "Enviado", tone: "text-[var(--accent-2)]" };
    case "PROCESSING":
      return { label: "Processando", tone: "text-[var(--accent-2)]" };
    case "PAID":
      return { label: "Pago", tone: "text-[var(--accent)]" };
    case "AWAITING_PAYMENT":
      return { label: "Aguardando pagamento", tone: "text-[var(--warning)]" };
    case "CANCELED":
      return { label: "Cancelado", tone: "text-[var(--danger)]" };
    default:
      return { label: "Pendente", tone: "text-[var(--muted)]" };
  }
}

function paymentMeta(status?: string | null) {
  switch (status) {
    case "APPROVED":
      return { label: "Aprovado", tone: "text-[var(--accent)]" };
    case "REJECTED":
      return { label: "Recusado", tone: "text-[var(--danger)]" };
    case "CANCELED":
      return { label: "Cancelado", tone: "text-[var(--danger)]" };
    case "REFUNDED":
      return { label: "Estornado", tone: "text-[var(--warning)]" };
    default:
      return { label: "Pendente", tone: "text-[var(--accent-2)]" };
  }
}

export default async function AdminOrderDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      address: true,
      items: { include: { product: true } },
      payment: true,
      user: { select: { email: true, name: true, role: true } }
    }
  });

  if (!order) {
    notFound();
  }

  const shippingAddress = order.shippingAddress as Record<string, string> | null;
  const status = statusMeta(order.status);
  const payment = paymentMeta(order.payment?.status);

  return (
    <main className="container grid gap-8 py-10">
      <div className="commerce-hero-panel panel flex flex-wrap items-end justify-between gap-4 overflow-hidden p-5 md:p-6">
        <div>
          <p className="eyebrow">admin</p>
          <h1 className="text-balance text-4xl font-black md:text-5xl">
            Pedido {order.id.slice(0, 8)}
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            Criado em {order.createdAt.toLocaleString("pt-BR")} por {order.customerEmail}.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <span className={`chip ${status.tone}`}>{status.label}</span>
            <span className={`chip ${payment.tone}`}>pagamento {payment.label.toLowerCase()}</span>
            <span className="chip bg-black/40">{order.items.length} item(ns)</span>
          </div>
        </div>
        <Link className="btn secondary" href="/admin/pedidos">
          Voltar
        </Link>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-4">
          <article className="commerce-flow-card panel grid gap-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-[var(--muted)]">Itens</p>
                <h2 className="text-2xl font-bold">Resumo do pedido</h2>
              </div>
              <span className={`chip ${status.tone}`}>{status.label}</span>
            </div>

            <div className="grid gap-3">
              {order.items.map((item) => (
                <div
                  className="grid gap-3 rounded-lg border border-[var(--line)] bg-black/20 p-3 md:grid-cols-[1fr_120px]"
                  key={item.id}
                >
                  <div>
                    <strong>{item.name}</strong>
                    <p className="text-sm text-[var(--muted)]">
                      {item.quantity} unidade(s) x {centsToBRL(item.unitCents)}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      Estoque atual: {item.product.stock}
                    </p>
                  </div>
                  <strong className="text-right text-[var(--accent)]">
                    {centsToBRL(item.totalCents)}
                  </strong>
                </div>
              ))}
            </div>

            <div className="grid gap-2 border-t border-[var(--line)] pt-4 text-sm">
              <p className="flex justify-between">
                <span>Produtos</span>
                <strong>{centsToBRL(order.subtotalCents)}</strong>
              </p>
              {order.productDiscountCents > 0 ? (
                <p className="flex justify-between text-[var(--accent)]">
                  <span>Desconto nos produtos {order.couponCode ? `(${order.couponCode})` : ""}</span>
                  <strong>- {centsToBRL(order.productDiscountCents)}</strong>
                </p>
              ) : null}
              {order.freightDiscountCents > 0 ? (
                <p className="flex justify-between text-[var(--accent-2)]">
                  <span>Desconto no frete {order.couponCode ? `(${order.couponCode})` : ""}</span>
                  <strong>- {centsToBRL(order.freightDiscountCents)}</strong>
                </p>
              ) : null}
              {order.discountCents > 0 &&
              order.productDiscountCents === 0 &&
              order.freightDiscountCents === 0 ? (
                <p className="flex justify-between text-[var(--accent)]">
                  <span>Economia {order.couponCode ? `(${order.couponCode})` : ""}</span>
                  <strong>- {centsToBRL(order.discountCents)}</strong>
                </p>
              ) : null}
              <p className="flex justify-between">
                <span>Frete</span>
                <strong>{centsToBRL(order.freightCents)}</strong>
              </p>
              <p className="flex justify-between text-xl">
                <span>Total</span>
                <strong className="text-[var(--accent)]">{centsToBRL(order.totalCents)}</strong>
              </p>
            </div>
          </article>

          <article className="commerce-flow-card panel grid gap-3 p-5">
            <TruckIcon className="size-5 text-[var(--accent)]" />
            <h2 className="text-2xl font-bold">Entrega</h2>
            <div className="grid gap-1 text-sm text-[var(--muted)]">
              <p>{order.customerName}</p>
              <p>
                {shippingAddress?.street}, {shippingAddress?.number}
                {shippingAddress?.complement ? ` - ${shippingAddress.complement}` : ""}
              </p>
              <p>
                {shippingAddress?.district} - {shippingAddress?.city}/{shippingAddress?.state}
              </p>
              <p>CEP {shippingAddress?.zipCode}</p>
              <p>Telefone {shippingAddress?.phone}</p>
            </div>
          </article>
        </div>

        <aside className="grid h-fit gap-4">
          <article className="commerce-flow-card panel grid gap-3 p-5">
            <ShieldIcon className="size-5 text-[var(--accent-2)]" />
            <h2 className="text-xl font-bold">Status operacional</h2>
            <div className="grid gap-2 text-sm text-[var(--muted)]">
              <span className={`chip ${status.tone}`}>pedido {status.label.toLowerCase()}</span>
              <span className={`chip ${payment.tone}`}>pagamento {payment.label.toLowerCase()}</span>
            </div>
            <OrderStatusForm orderId={order.id} status={order.status} />
          </article>

          <article className="commerce-flow-card panel grid gap-2 p-5 text-sm">
            <h2 className="text-xl font-bold">Pagamento</h2>
            <p className="flex justify-between">
              <span className="text-[var(--muted)]">Gateway</span>
              <strong>{order.payment?.provider ?? "pendente"}</strong>
            </p>
            <p className="flex justify-between">
              <span className="text-[var(--muted)]">Status</span>
              <strong className={payment.tone}>{payment.label}</strong>
            </p>
            <p className="flex justify-between">
              <span className="text-[var(--muted)]">Valor</span>
              <strong>{centsToBRL(order.payment?.amountCents ?? order.totalCents)}</strong>
            </p>
            {order.payment?.checkoutUrl ? (
              <Link className="btn secondary mt-2" href={order.payment.checkoutUrl}>
                Abrir checkout
              </Link>
            ) : null}
          </article>
        </aside>
      </section>
    </main>
  );
}
