import Image from "next/image";
import {
  ProductDeleteButton,
  ProductForm,
  StockAdjustForm
} from "@/components/admin-forms";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { centsToBRL } from "@/lib/utils/money";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string; stock?: string }>;
}) {
  await requireAdmin();
  const { q, status, stock } = await searchParams;
  const query = q?.trim();
  const products = await prisma.product.findMany({
    where: {
      ...(status === "active" ? { active: true } : {}),
      ...(status === "inactive" ? { active: false } : {}),
      ...(stock === "low" ? { stock: { lte: 5 } } : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { slug: { contains: query, mode: "insensitive" } },
              { category: { contains: query, mode: "insensitive" } }
            ]
          }
        : {})
    },
    include: {
      inventoryMovements: {
        orderBy: { createdAt: "desc" },
        take: 5
      }
    },
    orderBy: { updatedAt: "desc" }
  });

  return (
    <main className="container grid gap-8 py-10">
      <div className="grid gap-3">
        <p className="eyebrow">admin</p>
        <h1 className="text-4xl font-black">Produtos e estoque</h1>
        <form className="surface grid gap-3 p-3 md:grid-cols-[1fr_160px_160px_auto]">
          <input className="input" defaultValue={query} name="q" placeholder="Buscar nome, slug ou categoria" />
          <select className="input" defaultValue={status ?? ""} name="status">
            <option value="">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
          <select className="input" defaultValue={stock ?? ""} name="stock">
            <option value="">Qualquer estoque</option>
            <option value="low">Estoque baixo</option>
          </select>
          <button className="btn" type="submit">
            Filtrar
          </button>
        </form>
      </div>

      <ProductForm />

      <section className="grid gap-4">
        {products.map((product) => (
          <article className="panel grid gap-4 p-4 lg:grid-cols-[120px_1fr_360px]" key={product.id}>
            <div className="relative aspect-square overflow-hidden rounded-lg bg-black">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                sizes="120px"
                className="object-cover"
              />
            </div>
            <div className="grid gap-3">
              <div>
                <h2 className="text-xl font-bold">{product.name}</h2>
                <p className="text-sm text-[var(--muted)]">{product.slug}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.category ? <span className="chip">{product.category}</span> : null}
                  <span className={product.active ? "chip text-[var(--accent)]" : "chip text-[var(--danger)]"}>
                    {product.active ? "ativo" : "inativo"}
                  </span>
                  {product.featured ? <span className="chip">destaque</span> : null}
                  {product.stock <= 5 ? <span className="chip text-[var(--warning)]">estoque baixo</span> : null}
                </div>
                <p className="mt-3 font-bold text-[var(--accent)]">
                  {centsToBRL(product.promotionalCents ?? product.priceCents)}
                </p>
                <p className="text-sm text-[var(--muted)]">Estoque: {product.stock}</p>
              </div>
              <div className="grid gap-1 text-xs text-[var(--muted)]">
                <p className="font-bold text-[var(--foreground)]">Historico recente</p>
                {product.inventoryMovements.length > 0 ? (
                  product.inventoryMovements.map((movement) => (
                    <p key={movement.id}>
                      {movement.type} {movement.quantity > 0 ? "+" : ""}
                      {movement.quantity} - {movement.note ?? "sem nota"}
                    </p>
                  ))
                ) : (
                  <p>Sem movimentacao.</p>
                )}
              </div>
              <StockAdjustForm product={product} />
            </div>
            <div className="grid gap-3">
              <ProductForm product={product} />
              <ProductDeleteButton productId={product.id} />
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
