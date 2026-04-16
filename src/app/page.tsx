import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featured = await prisma.product.findMany({
    where: { active: true },
    orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
    take: 6
  });

  return (
    <main>
      <section className="container grid gap-8 py-12 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div className="grid gap-5">
          <p className="font-bold text-[var(--accent)]">Importados tech com estoque proprio</p>
          <h1 className="max-w-3xl text-5xl font-black leading-tight md:text-7xl">
            Gadget bom, preço direto, papo reto.
          </h1>
          <p className="max-w-xl text-lg text-[var(--muted)]">
            O 10PILA junta achadinhos tech, setup e utilidades importadas sem
            prometer milagre. O que aparece aqui vem do estoque da loja.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link className="btn" href="/produtos">
              Ver catalogo
            </Link>
            <Link className="btn secondary" href="/auth/register">
              Criar conta
            </Link>
          </div>
        </div>
        <div className="panel grid gap-4 p-5">
          <p className="text-sm font-bold text-[var(--accent-2)]">status do MVP</p>
          <div className="grid gap-3 text-sm text-[var(--muted)]">
            <p>Pix, cartao e boleto preparados via Checkout Pro.</p>
            <p>Frete fixo no checkout para manter o deploy sem novela.</p>
            <p>Chat consulta catalogo e pedidos sem inventar estoque.</p>
          </div>
        </div>
      </section>

      <section className="container grid gap-5 pb-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-[var(--accent)]">vitrine</p>
            <h2 className="text-3xl font-black">Produtos em destaque</h2>
          </div>
          <Link className="btn secondary" href="/produtos">
            Todos
          </Link>
        </div>
        <div className="grid-products">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}
