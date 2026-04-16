import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { EmptyState } from "@/components/empty-state";
import { SearchIcon, SparkIcon } from "@/components/icons";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const { q, sort } = await searchParams;
  const query = q?.trim();
  const orderBy =
    sort === "price-asc"
      ? [{ promotionalCents: "asc" as const }, { priceCents: "asc" as const }]
      : sort === "price-desc"
        ? [{ promotionalCents: "desc" as const }, { priceCents: "desc" as const }]
        : sort === "stock"
          ? [{ stock: "desc" as const }]
          : [{ featured: "desc" as const }, { updatedAt: "desc" as const }];
  const products = await prisma.product.findMany({
    where: {
      active: true,
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } }
            ]
          }
        : {})
    },
    orderBy
  });

  return (
    <main className="container grid gap-8 py-10">
      <div className="grid gap-4">
        <p className="eyebrow">
          <SparkIcon />
          catalogo
        </p>
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <h1 className="text-4xl font-black">Garimpo tech do 10PILA</h1>
            <p className="mt-2 max-w-xl text-[var(--muted)]">
              Busca direta no estoque: achou, tem pagina, preço e status sem enrolacao.
            </p>
          </div>
          <span className="chip">{products.length} item(ns)</span>
        </div>
        <form className="surface grid gap-3 p-3 md:grid-cols-[1fr_180px_auto]">
          <label className="relative">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
            <input
              className="input pl-10"
              defaultValue={query}
              name="q"
              placeholder="Buscar por teclado, fone, hub..."
            />
          </label>
          <select className="input" defaultValue={sort ?? ""} name="sort">
            <option value="">Destaques</option>
            <option value="price-asc">Menor preco</option>
            <option value="price-desc">Maior preco</option>
            <option value="stock">Mais estoque</option>
          </select>
          <button className="btn" type="submit">
            Buscar
          </button>
        </form>
      </div>

      {products.length > 0 ? (
        <div className="grid-products">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <EmptyState
          eyebrow={
            <>
              <SparkIcon />
              busca
            </>
          }
          title="Nada encontrado"
          description="Esse termo nao puxou item nenhum do estoque. Tenta categoria, marca ou um nome mais curto."
          actions={
            <Link className="btn secondary" href="/produtos">
              Limpar busca
            </Link>
          }
        />
      )}
    </main>
  );
}
