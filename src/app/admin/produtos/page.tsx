import Image from "next/image";
import type { CSSProperties } from "react";
import {
  ProductDeleteButton,
  ProductForm,
  StockAdjustForm
} from "@/components/admin-forms";
import { requireAdmin } from "@/lib/auth/session";
import { categoryVisual } from "@/lib/catalog/visuals";
import { prisma } from "@/lib/db/prisma";
import { centsToBRL } from "@/lib/utils/money";

export const dynamic = "force-dynamic";

function movementLabel(type: string) {
  switch (type) {
    case "SALE":
      return "Venda";
    case "SEED":
      return "Seed";
    case "ADJUSTMENT":
      return "Ajuste";
    case "CANCELATION":
      return "Cancelamento";
    default:
      return type;
  }
}

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
  const totalProducts = products.length;
  const activeProducts = products.filter((product) => product.active).length;
  const lowStockProducts = products.filter((product) => product.stock <= 5).length;
  const featuredProducts = products.filter((product) => product.featured).length;

  return (
    <main className="container grid gap-8 py-10">
      <div className="grid gap-3">
        <p className="eyebrow">admin</p>
        <h1 className="text-4xl font-black">Produtos e estoque</h1>
        <p className="max-w-2xl text-sm text-[var(--muted)]">
          Painel para leitura rapida de catalogo, estoque e movimentacao recente sem depender de abrir item por item.
        </p>
        <section className="grid gap-3 md:grid-cols-4">
          <div className="panel interactive-panel grid gap-2 p-4">
            <p className="text-sm text-[var(--muted)]">Produtos no recorte</p>
            <strong className="text-3xl">{totalProducts}</strong>
          </div>
          <div className="panel interactive-panel grid gap-2 p-4">
            <p className="text-sm text-[var(--muted)]">Ativos</p>
            <strong className="text-3xl text-[var(--accent)]">{activeProducts}</strong>
          </div>
          <div className="panel interactive-panel grid gap-2 p-4">
            <p className="text-sm text-[var(--muted)]">Estoque baixo</p>
            <strong className="text-3xl text-[var(--warning)]">{lowStockProducts}</strong>
          </div>
          <div className="panel interactive-panel grid gap-2 p-4">
            <p className="text-sm text-[var(--muted)]">Destaques</p>
            <strong className="text-3xl text-[var(--accent-2)]">{featuredProducts}</strong>
          </div>
        </section>
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
          <article className="commerce-flow-card panel grid gap-4 p-4 lg:grid-cols-[120px_1fr_360px]" key={product.id}>
            <div
              className="catalog-media-shell relative aspect-square overflow-hidden rounded-lg bg-black"
              style={
                {
                  "--catalog-accent": categoryVisual(product.category ?? undefined).accent,
                  "--catalog-accent-soft": categoryVisual(product.category ?? undefined).accentSoft
                } as CSSProperties
              }
            >
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
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold">{product.name}</h2>
                  <span className={product.active ? "chip text-[var(--accent)]" : "chip text-[var(--danger)]"}>
                    {product.active ? "ativo" : "inativo"}
                  </span>
                </div>
                <p className="text-sm text-[var(--muted)]">{product.slug}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.category ? <span className="chip">{product.category}</span> : null}
                  {product.featured ? <span className="chip">destaque</span> : null}
                  {product.stock <= 5 ? <span className="chip text-[var(--warning)]">estoque baixo</span> : null}
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase text-[var(--muted)]">Preco atual</p>
                    <p className="font-bold text-[var(--accent)]">{centsToBRL(product.promotionalCents ?? product.priceCents)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-[var(--muted)]">Estoque atual</p>
                    <p className={`font-bold ${product.stock <= 5 ? "text-[var(--warning)]" : "text-[var(--foreground)]"}`}>{product.stock}</p>
                  </div>
                </div>
              </div>
              <div className="grid gap-1 text-xs text-[var(--muted)]">
                <p className="font-bold text-[var(--foreground)]">Historico recente</p>
                {product.inventoryMovements.length > 0 ? (
                  product.inventoryMovements.map((movement) => (
                    <p key={movement.id}>
                      {movementLabel(movement.type)} {movement.quantity > 0 ? "+" : ""}
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
