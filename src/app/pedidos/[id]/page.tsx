import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderSignalIllustration } from "@/components/brand-illustrations";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { centsToBRL } from "@/lib/utils/money";

export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id, userId: user.id },
    include: { items: true, payment: true }
  });

  if (!order) {
    notFound();
  }

  return (
    <main className="container grid gap-8 py-10">
      <div className="grid gap-2">
        <p className="eyebrow">pedido</p>
        <h1 className="text-4xl font-black">Acompanhamento {order.id.slice(0, 8)}</h1>
        <p className="text-[var(--muted)]">
          Status do pedido: <strong className="text-[var(--foreground)]">{order.status}</strong>
        </p>
      </div>

      <section className="panel grid gap-3 p-5 lg:grid-cols-[1fr_280px]">
        <div className="grid gap-3">
          <div className="mb-1 flex items-center gap-3">
            <OrderSignalIllustration className="size-18" />
            <div className="grid gap-1">
              <p className="text-sm font-black uppercase text-[var(--accent-2)]">pedido em trilho</p>
              <p className="text-sm text-[var(--muted)]">Pagamento, itens e acompanhamento no mesmo painel.</p>
            </div>
          </div>
          <h2 className="text-2xl font-bold">Itens</h2>
          {order.items.map((item) => (
            <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] pb-3" key={item.id}>
              <div>
                <p className="font-bold">{item.name}</p>
                <p className="text-sm text-[var(--muted)]">
                  {item.quantity}x {centsToBRL(item.unitCents)}
                </p>
              </div>
              <strong>{centsToBRL(item.totalCents)}</strong>
            </div>
          ))}
        </div>

        <aside className="order-sidebar grid h-fit gap-3 rounded-lg border border-[var(--line)] bg-black/20 p-4">
          <p className="text-sm text-[var(--muted)]">Pagamento</p>
          <p className="text-xl font-black">{order.payment?.status ?? "PENDING"}</p>
          <p className="text-sm text-[var(--muted)]">Total {centsToBRL(order.totalCents)}</p>
          {order.discountCents > 0 ? (
            <p className="text-sm text-[var(--accent)]">
              Desconto {order.couponCode ? `(${order.couponCode}) ` : ""}- {centsToBRL(order.discountCents)}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {order.payment?.checkoutUrl ? (
              <Link className="btn" href={order.payment.checkoutUrl}>
                Abrir pagamento
              </Link>
            ) : null}
            <Link className="btn secondary" href="/produtos">
              Continuar comprando
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}
