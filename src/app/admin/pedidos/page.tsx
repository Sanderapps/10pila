import { OrderStatusForm } from "@/components/admin-forms";
import { CartIcon, SearchIcon, TruckIcon } from "@/components/icons";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { centsToBRL } from "@/lib/utils/money";
import { OrderStatus } from "@prisma/client";
import Link from "next/link";

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

function paymentStatusMeta(status?: string | null) {
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

export default async function AdminOrdersPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireAdmin();
  const { q, status } = await searchParams;
  const selectedStatus = Object.values(OrderStatus).includes(status as OrderStatus)
    ? (status as OrderStatus)
    : undefined;
  const orders = await prisma.order.findMany({
    where: {
      status: selectedStatus,
      OR: q
        ? [
            { id: { contains: q, mode: "insensitive" } },
            { customerName: { contains: q, mode: "insensitive" } },
            { customerEmail: { contains: q, mode: "insensitive" } }
          ]
        : undefined
    },
    orderBy: { createdAt: "desc" },
    include: {
      items: true,
      payment: true,
      user: { select: { email: true, name: true } }
    }
  });
  const statusGroups = await prisma.order.groupBy({
    by: ["status"],
    _count: true
  });
  const totalOrders = statusGroups.reduce((total, group) => total + group._count, 0);
  const paidOrdersCount = statusGroups
    .filter((group) => ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"].includes(group.status))
    .reduce((total, group) => total + group._count, 0);
  const awaitingOrdersCount = statusGroups
    .filter((group) => ["PENDING", "AWAITING_PAYMENT"].includes(group.status))
    .reduce((total, group) => total + group._count, 0);
  const deliveredOrdersCount = statusGroups
    .filter((group) => group.status === "DELIVERED")
    .reduce((total, group) => total + group._count, 0);
  const totalRevenue = orders
    .filter((order) => ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"].includes(order.status))
    .reduce((total, order) => total + order.totalCents, 0);

  return (
    <main className="container grid gap-8 py-10">
      <div>
        <p className="eyebrow">admin</p>
        <h1 className="text-balance text-4xl font-black md:text-5xl">Pedidos</h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Operacao de pedidos, pagamento, separacao e entrega em um painel so.
        </p>
      </div>

      <section className="grid gap-3 md:grid-cols-4">
        <div className="panel interactive-panel grid gap-2 p-4">
          <CartIcon className="size-5 text-[var(--accent)]" />
          <p className="text-sm text-[var(--muted)]">Pedidos totais</p>
          <strong className="text-3xl">{totalOrders}</strong>
        </div>
        <div className="panel interactive-panel grid gap-2 p-4">
          <TruckIcon className="size-5 text-[var(--accent-2)]" />
          <p className="text-sm text-[var(--muted)]">Em trilho</p>
          <strong className="text-3xl">{paidOrdersCount}</strong>
        </div>
        <div className="panel interactive-panel grid gap-2 p-4">
          <TruckIcon className="size-5 text-[var(--warning)]" />
          <p className="text-sm text-[var(--muted)]">Aguardando acao</p>
          <strong className="text-3xl">{awaitingOrdersCount}</strong>
        </div>
        <div className="panel interactive-panel grid gap-2 p-4">
          <TruckIcon className="size-5 text-[var(--accent)]" />
          <p className="text-sm text-[var(--muted)]">Receita no painel</p>
          <strong className="text-2xl">{centsToBRL(totalRevenue)}</strong>
          <span className="text-xs text-[var(--muted)]">{deliveredOrdersCount} entregue(s)</span>
        </div>
      </section>

      <form className="panel grid gap-3 p-4 md:grid-cols-[1fr_220px_160px]">
        <label className="label">
          Buscar
          <span className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
            <input
              className="input pl-10"
              defaultValue={q}
              name="q"
              placeholder="Pedido, nome ou email"
            />
          </span>
        </label>
        <label className="label">
          Status
          <select className="input" defaultValue={selectedStatus ?? ""} name="status">
              <option value="">Todos</option>
              {Object.values(OrderStatus).map((option) => (
                <option key={option} value={option}>
                  {statusMeta(option).label}
                </option>
              ))}
            </select>
        </label>
        <button className="btn mt-auto" type="submit">
          Filtrar
        </button>
      </form>

      <section className="grid gap-4">
        {orders.length === 0 ? (
          <article className="panel grid gap-2 p-5">
            <h2 className="text-xl font-bold">Nada por aqui</h2>
            <p className="text-[var(--muted)]">Nenhum pedido bate com os filtros atuais.</p>
          </article>
        ) : null}

        {orders.map((order) => (
          <article className="commerce-flow-card panel interactive-panel grid gap-4 p-5" key={order.id}>
            <div className="grid gap-3 md:grid-cols-[1fr_220px]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold">Pedido {order.id.slice(0, 8)}</h2>
                  <span className={`chip ${statusMeta(order.status).tone}`}>{statusMeta(order.status).label}</span>
                  <span className={`chip ${paymentStatusMeta(order.payment?.status).tone}`}>
                    pagamento {paymentStatusMeta(order.payment?.status).label.toLowerCase()}
                  </span>
                </div>
                <p className="text-sm text-[var(--muted)]">
                  {order.customerName} | {order.customerEmail}
                </p>
                <p className="text-sm text-[var(--muted)]">
                  {order.items.length} item(ns) | criado em {new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short"
                  }).format(order.createdAt)}
                </p>
              </div>
              <OrderStatusForm orderId={order.id} status={order.status} />
            </div>
            <div className="grid gap-2 text-sm text-[var(--muted)] md:grid-cols-[1fr_auto] md:items-start">
              <div className="grid gap-1">
                {order.items.slice(0, 3).map((item) => (
                  <p key={item.id}>
                    {item.quantity}x {item.name} - {centsToBRL(item.totalCents)}
                  </p>
                ))}
                {order.items.length > 3 ? (
                  <p className="text-xs text-[var(--muted)]">+ {order.items.length - 3} item(ns) no detalhe</p>
                ) : null}
              </div>
              <div className="grid gap-1 text-right">
                <p className="text-xs uppercase text-[var(--muted)]">Total</p>
                <p className="text-xl font-black text-[var(--accent)]">{centsToBRL(order.totalCents)}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link className="btn secondary w-fit" href={`/admin/pedidos/${order.id}`}>
                Ver detalhes
              </Link>
              {order.payment?.checkoutUrl ? (
                <Link className="btn secondary w-fit" href={order.payment.checkoutUrl}>
                  Abrir checkout
                </Link>
              ) : null}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
