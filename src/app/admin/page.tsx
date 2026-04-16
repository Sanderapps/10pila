import Link from "next/link";
import { AdminConsoleIllustration } from "@/components/brand-illustrations";
import { BrandLogo } from "@/components/brand-logo";
import { BoltIcon, CartIcon, ShieldIcon } from "@/components/icons";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { centsToBRL } from "@/lib/utils/money";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const [products, orders, lowStock] = await Promise.all([
    prisma.product.groupBy({ by: ["active"], _count: true }),
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
  const activeProducts = products.find((item) => item.active)?._count ?? 0;
  const inactiveProducts = products.find((item) => !item.active)?._count ?? 0;
  const statusGroups = await prisma.order.groupBy({ by: ["status"], _count: true });

  return (
    <main className="container grid gap-8 py-10">
      <div>
        <BrandLogo animated variant="compact" className="mb-4 w-fit" />
        <p className="eyebrow">admin</p>
        <h1 className="text-4xl font-black">Operacao 10PILA</h1>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="panel interactive-panel p-5">
          <p className="text-sm text-[var(--muted)]">Produtos ativos</p>
          <p className="text-4xl font-black">{activeProducts}</p>
          <p className="text-xs text-[var(--muted)]">{inactiveProducts} inativo(s)</p>
        </div>
        <div className="panel interactive-panel p-5">
          <p className="text-sm text-[var(--muted)]">Pedidos</p>
          <p className="text-4xl font-black">{orders}</p>
        </div>
        <div className="panel interactive-panel p-5">
          <p className="text-sm text-[var(--muted)]">Receita paga</p>
          <p className="text-4xl font-black">{centsToBRL(revenue._sum.totalCents ?? 0)}</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Link className="btn shine gap-2" href="/admin/produtos">
          <ShieldIcon />
          Gerenciar produtos
        </Link>
        <Link className="btn secondary gap-2" href="/admin/pedidos">
          <CartIcon />
          Ver pedidos
        </Link>
      </section>

      <section className="panel grid gap-3 p-5">
        <h2 className="text-2xl font-bold">Pedidos por status</h2>
        <div className="flex flex-wrap gap-2">
          {statusGroups.map((group) => (
            <span className="chip" key={group.status}>
              {group.status}: {group._count}
            </span>
          ))}
        </div>
      </section>

      <section className="panel grid gap-3 p-5">
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <BoltIcon className="size-5 text-[var(--warning)]" />
          Estoque baixo
        </h2>
        {lowStock.length > 0 ? (
          lowStock.map((product) => (
            <p className="text-sm text-[var(--muted)]" key={product.id}>
              {product.name}: {product.stock} unidades
            </p>
          ))
        ) : (
          <div className="grid justify-items-start gap-3 text-sm text-[var(--muted)]">
            <AdminConsoleIllustration className="size-20" />
            <p>Nada critico agora.</p>
          </div>
        )}
      </section>
    </main>
  );
}
