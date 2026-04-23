import Image from "next/image";
import Link from "next/link";
import type { Product } from "@prisma/client";
import type { CSSProperties } from "react";
import { BoltIcon, CartIcon } from "@/components/icons";
import { categoryVisual } from "@/lib/catalog/visuals";
import { centsToBRL } from "@/lib/utils/money";

export function ProductCard({ product }: { product: Product }) {
  const price = product.promotionalCents ?? product.priceCents;
  const hasDiscount = product.promotionalCents !== null;
  const stockTone = product.stock > 0 ? "chip" : "chip text-[var(--danger)]";
  const visual = categoryVisual(product.category ?? undefined);

  return (
    <article className="panel interactive-panel catalog-card shine group grid overflow-hidden">
      <Link href={`/produtos/${product.slug}`}>
        <div
          className="catalog-media-shell relative aspect-[4/3] overflow-hidden bg-black"
          style={
            {
              "--catalog-accent": visual.accent,
              "--catalog-accent-soft": visual.accentSoft
            } as CSSProperties
          }
        >
          <div className="absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-black/68 to-transparent" />
          <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2">
            {hasDiscount ? (
              <span className="chip border-[var(--accent)] bg-black/70 text-[var(--accent)]">
                <BoltIcon />
                oferta
              </span>
            ) : null}
            {product.featured ? <span className="chip bg-black/70">destaque</span> : null}
            {product.category ? <span className="chip bg-black/70">{product.category}</span> : null}
          </div>
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 320px"
            className="catalog-card-image object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        </div>
      </Link>
      <div className="grid gap-3 p-4">
        <div>
          <Link href={`/produtos/${product.slug}`}>
            <h3 className="text-lg font-black transition group-hover:text-[var(--accent)]">
              {product.name}
            </h3>
          </Link>
          <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">
            {product.description}
          </p>
        </div>
        <div className="flex items-end justify-between gap-3 border-t border-[var(--line)] pt-3">
          <div>
            {product.promotionalCents ? (
              <p className="text-xs text-[var(--muted)] line-through">
                {centsToBRL(product.priceCents)}
              </p>
            ) : null}
            <p className="text-xl font-black text-[var(--accent)]">
              {centsToBRL(price)}
            </p>
          </div>
          <span className={stockTone}>
            {product.stock > 0 ? `${product.stock} em estoque` : "sem estoque"}
          </span>
        </div>
        <Link className="btn secondary catalog-card-cta min-h-10 gap-2" href={`/produtos/${product.slug}`}>
          <CartIcon />
          Ver produto
        </Link>
      </div>
    </article>
  );
}
