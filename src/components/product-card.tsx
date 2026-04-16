import Image from "next/image";
import Link from "next/link";
import type { Product } from "@prisma/client";
import { BoltIcon, CartIcon } from "@/components/icons";
import { centsToBRL } from "@/lib/utils/money";

export function ProductCard({ product }: { product: Product }) {
  const price = product.promotionalCents ?? product.priceCents;
  const hasDiscount = product.promotionalCents !== null;

  return (
    <article className="panel shine group grid overflow-hidden transition duration-200 hover:-translate-y-1 hover:border-[var(--line-strong)]">
      <Link href={`/produtos/${product.slug}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-black">
          <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2">
            {hasDiscount ? (
              <span className="chip border-[var(--accent)] bg-black/70 text-[var(--accent)]">
                <BoltIcon />
                oferta
              </span>
            ) : null}
            {product.featured ? <span className="chip bg-black/70">destaque</span> : null}
          </div>
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 320px"
            className="object-cover transition duration-500 group-hover:scale-105"
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
          <span className={product.stock > 0 ? "chip" : "chip text-[var(--danger)]"}>
            {product.stock > 0 ? `${product.stock} em estoque` : "sem estoque"}
          </span>
        </div>
        <Link className="btn secondary min-h-10 gap-2" href={`/produtos/${product.slug}`}>
          <CartIcon />
          Ver produto
        </Link>
      </div>
    </article>
  );
}
