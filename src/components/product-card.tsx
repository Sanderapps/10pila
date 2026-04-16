import Image from "next/image";
import Link from "next/link";
import type { Product } from "@prisma/client";
import { centsToBRL } from "@/lib/utils/money";

export function ProductCard({ product }: { product: Product }) {
  const price = product.promotionalCents ?? product.priceCents;

  return (
    <article className="panel overflow-hidden">
      <Link href={`/produtos/${product.slug}`}>
        <div className="relative aspect-[4/3] bg-black">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 320px"
            className="object-cover"
          />
        </div>
      </Link>
      <div className="grid gap-3 p-4">
        <div>
          <h3 className="text-lg font-bold">{product.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">
            {product.description}
          </p>
        </div>
        <div className="flex items-end justify-between gap-3">
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
          <span className="text-xs text-[var(--muted)]">
            {product.stock > 0 ? `${product.stock} em estoque` : "sem estoque"}
          </span>
        </div>
      </div>
    </article>
  );
}
