import { ProductCard } from "@/components/product-card";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim();
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
    orderBy: [{ featured: "desc" }, { updatedAt: "desc" }]
  });

  return (
    <main className="container grid gap-8 py-10">
      <div className="grid gap-3">
        <p className="font-bold text-[var(--accent)]">catalogo</p>
        <h1 className="text-4xl font-black">Garimpo tech do 10PILA</h1>
        <form className="flex max-w-xl gap-2">
          <input className="input" name="q" placeholder="Buscar por teclado, fone, hub..." />
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
        <p className="panel p-5 text-[var(--muted)]">
          Nada encontrado. Talvez o produto ainda esteja no multiverso do fornecedor.
        </p>
      )}
    </main>
  );
}
