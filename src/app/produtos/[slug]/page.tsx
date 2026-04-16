import Image from "next/image";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { prisma } from "@/lib/db/prisma";
import { centsToBRL } from "@/lib/utils/money";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug }
  });

  if (!product?.active) {
    notFound();
  }

  const price = product.promotionalCents ?? product.priceCents;

  return (
    <main className="container grid gap-8 py-10 md:grid-cols-[1fr_0.9fr]">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-[var(--line)] bg-black">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, 600px"
          className="object-cover"
          priority
        />
      </div>
      <section className="grid content-start gap-5">
        <p className="font-bold text-[var(--accent)]">produto</p>
        <h1 className="text-4xl font-black">{product.name}</h1>
        <p className="text-[var(--muted)]">{product.description}</p>
        <div>
          {product.promotionalCents ? (
            <p className="text-[var(--muted)] line-through">{centsToBRL(product.priceCents)}</p>
          ) : null}
          <p className="text-4xl font-black text-[var(--accent)]">{centsToBRL(price)}</p>
        </div>
        <p className="text-sm text-[var(--muted)]">
          {product.stock > 0 ? `${product.stock} unidades disponiveis` : "Sem estoque agora"}
        </p>
        {product.stock > 0 ? (
          <AddToCartButton maxQuantity={product.stock} productId={product.id} />
        ) : (
          <button className="btn secondary" disabled>
            Indisponivel
          </button>
        )}
      </section>
    </main>
  );
}
