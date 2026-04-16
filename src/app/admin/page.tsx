import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { centsToBRL } from "@/lib/utils/money";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const [products, orders, lowStock] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.product.findMany({
      where: { stock: { lte: 5 } },
      orderBy: { stock: "asc" },
      take: 5
    })
  ]);
  const revenue = await prisma.order.aggregate({
    where: { status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] } },
    _sum: { totalCents: true }
  });

  return (
    <main className="container grid gap-8 py-10">
      <div>
        <p className="font-bold text-[var(--accent)]">admin</p>
        <h1 className="text-4xl font-black">Operacao 10PILA</h1>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="panel p-5">
          <p className="text-sm text-[var(--muted)]">Produtos</p>
          <p className="text-4xl font-black">{products}</p>
        </div>
        <div className="panel p-5">
          <p className="text-sm text-[var(--muted)]">Pedidos</p>
          <p className="text-4xl font-black">{orders}</p>
        </div>
        <div className="panel p-5">
          <p className="text-sm text-[var(--muted)]">Receita paga</p>
          <p className="text-4xl font-black">{centsToBRL(revenue._sum.totalCents ?? 0)}</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Link className="btn" href="/admin/produtos">
          Gerenciar produtos
        </Link>
        <Link className="btn secondary" href="/admin/pedidos">
          Ver pedidos
        </Link>
      </section>

      <section className="panel grid gap-3 p-5">
        <h2 className="text-2xl font-bold">Estoque baixo</h2>
        {lowStock.length > 0 ? (
          lowStock.map((product) => (
            <p className="text-sm text-[var(--muted)]" key={product.id}>
              {product.name}: {product.stock} unidades
            </p>
          ))
        ) : (
          <p className="text-sm text-[var(--muted)]">Nada critico agora.</p>
        )}
      </section>
    </main>
  );
}
