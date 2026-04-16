import { OrderStatusForm } from "@/components/admin-forms";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { centsToBRL } from "@/lib/utils/money";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  await requireAdmin();
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: true,
      payment: true,
      user: { select: { email: true, name: true } }
    }
  });

  return (
    <main className="container grid gap-8 py-10">
      <div>
        <p className="font-bold text-[var(--accent)]">admin</p>
        <h1 className="text-4xl font-black">Pedidos</h1>
      </div>

      <section className="grid gap-4">
        {orders.map((order) => (
          <article className="panel grid gap-4 p-5" key={order.id}>
            <div className="grid gap-3 md:grid-cols-[1fr_220px]">
              <div>
                <h2 className="text-xl font-bold">Pedido {order.id.slice(0, 8)}</h2>
                <p className="text-sm text-[var(--muted)]">
                  {order.customerName} | {order.customerEmail}
                </p>
                <p className="text-sm text-[var(--muted)]">
                  Pagamento: {order.payment?.status ?? "sem pagamento"}
                </p>
              </div>
              <OrderStatusForm orderId={order.id} status={order.status} />
            </div>
            <div className="grid gap-2 text-sm text-[var(--muted)]">
              {order.items.map((item) => (
                <p key={item.id}>
                  {item.quantity}x {item.name} - {centsToBRL(item.totalCents)}
                </p>
              ))}
            </div>
            <p className="text-xl font-black text-[var(--accent)]">
              Total {centsToBRL(order.totalCents)}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
