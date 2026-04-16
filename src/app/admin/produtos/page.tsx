import Image from "next/image";
import { ProductCreateForm, StockAdjustForm } from "@/components/admin-forms";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { centsToBRL } from "@/lib/utils/money";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  await requireAdmin();
  const products = await prisma.product.findMany({
    orderBy: { updatedAt: "desc" }
  });

  return (
    <main className="container grid gap-8 py-10">
      <div>
        <p className="font-bold text-[var(--accent)]">admin</p>
        <h1 className="text-4xl font-black">Produtos e estoque</h1>
      </div>

      <ProductCreateForm />

      <section className="grid gap-4">
        {products.map((product) => (
          <article className="panel grid gap-4 p-4 md:grid-cols-[120px_1fr_320px]" key={product.id}>
            <div className="relative aspect-square overflow-hidden rounded-lg bg-black">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                sizes="120px"
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold">{product.name}</h2>
              <p className="text-sm text-[var(--muted)]">{product.slug}</p>
              <p className="mt-2 font-bold text-[var(--accent)]">
                {centsToBRL(product.promotionalCents ?? product.priceCents)}
              </p>
              <p className="text-sm text-[var(--muted)]">
                Estoque: {product.stock} | {product.active ? "ativo" : "inativo"}
              </p>
            </div>
            <StockAdjustForm product={product} />
          </article>
        ))}
      </section>
    </main>
  );
}
