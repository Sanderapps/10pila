import Image from "next/image";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { BoltIcon, ShieldIcon, SparkIcon, TruckIcon } from "@/components/icons";
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
  const hasDiscount = product.promotionalCents !== null;
  const specifications =
    product.specifications && typeof product.specifications === "object"
      ? Object.entries(product.specifications as Record<string, string>)
      : [];

  return (
    <main className="container grid gap-8 py-10 md:grid-cols-[1fr_0.9fr]">
      <div className="panel shine relative aspect-[4/3] overflow-hidden bg-black p-2">
        <div className="absolute left-5 top-5 z-10 flex flex-wrap gap-2">
          {hasDiscount ? (
            <span className="chip border-[var(--accent)] bg-black/70 text-[var(--accent)]">
              <BoltIcon />
              oferta ativa
            </span>
          ) : null}
          <span className="chip bg-black/70">estoque proprio</span>
        </div>
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, 600px"
          className="rounded-lg object-cover"
          priority
        />
      </div>
      <section className="grid content-start gap-5">
        <p className="eyebrow">
          <SparkIcon />
          {product.category ?? "produto"}
        </p>
        <h1 className="text-4xl font-black">{product.name}</h1>
        <p className="text-lg text-[var(--muted)]">{product.description}</p>
        <div className="surface grid gap-2 p-4">
          {product.promotionalCents ? (
            <p className="text-[var(--muted)] line-through">{centsToBRL(product.priceCents)}</p>
          ) : null}
          <p className="text-4xl font-black text-[var(--accent)]">{centsToBRL(price)}</p>
          <p className="text-sm text-[var(--muted)]">Pix, cartao e boleto no PagBank sandbox.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <span className="chip">
            <ShieldIcon />
            {product.stock > 0 ? `${product.stock} disponiveis` : "sem estoque"}
          </span>
          <span className="chip">
            <TruckIcon />
            frete fixo
          </span>
          <span className="chip">
            <BoltIcon />
            envio manual
          </span>
        </div>
        {product.stock > 0 ? (
          <AddToCartButton maxQuantity={product.stock} productId={product.id} />
        ) : (
          <button className="btn secondary" disabled>
            Indisponivel
          </button>
        )}
        <div className="panel grid gap-2 p-4 text-sm text-[var(--muted)]">
          <p className="font-bold text-[var(--foreground)]">Ficha rapida</p>
          <p>Sem variacoes no MVP. Quantidade limitada ao estoque real.</p>
          <p>Chat IA consulta esse produto pelo banco e manda o link certo.</p>
          {specifications.length > 0 ? (
            <dl className="mt-2 grid gap-2 border-t border-[var(--line)] pt-3">
              {specifications.map(([key, value]) => (
                <div className="flex justify-between gap-3" key={key}>
                  <dt className="text-[var(--muted)]">{key}</dt>
                  <dd className="font-bold text-[var(--foreground)]">{String(value)}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </section>
    </main>
  );
}
