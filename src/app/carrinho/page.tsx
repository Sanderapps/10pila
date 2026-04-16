import Image from "next/image";
import Link from "next/link";
import { CartOrbitIllustration } from "@/components/brand-illustrations";
import { CartActions } from "@/components/cart-actions";
import { CartSummary } from "@/components/cart-summary";
import { EmptyState } from "@/components/empty-state";
import { CartIcon } from "@/components/icons";
import { resolveCartCoupon } from "@/lib/commerce/cart-pricing";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { centsToBRL, freightCents } from "@/lib/utils/money";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const user = await requireUser();
  const items = await prisma.cartItem.findMany({
    where: { userId: user.id },
    include: { product: true },
    orderBy: { createdAt: "desc" }
  });

  const subtotal = items.reduce((total, item) => {
    const price = item.product.promotionalCents ?? item.product.priceCents;
    return total + price * item.quantity;
  }, 0);
  const freight = freightCents();
  const coupon = await resolveCartCoupon(user.id, subtotal, freight);
  const total = coupon?.totalCents ?? subtotal + freight;

  return (
    <main className="container grid gap-8 py-10 pb-32 lg:pb-10">
      <div>
        <p className="eyebrow">
          <CartIcon />
          carrinho
        </p>
        <h1 className="text-4xl font-black">Achado quase fechado</h1>
      </div>

      {items.length === 0 ? (
        <EmptyState
          art={<CartOrbitIllustration className="size-24" />}
          eyebrow={
            <>
              <CartIcon />
              carrinho
            </>
          }
          title="Seu carrinho ainda esta no modo vitrine"
          description="Nada caiu no carrinho ainda. Puxa um achado pro radar e a 10PILA fecha o resto daqui."
          actions={
            <>
              <Link className="btn" href="/produtos">
                Ver produtos
              </Link>
              <Link className="btn secondary" href="/">
                Voltar para home
              </Link>
            </>
          }
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <section className="grid gap-4">
            {items.map((item) => {
              const price = item.product.promotionalCents ?? item.product.priceCents;
              return (
                <article className="panel grid gap-4 p-4 md:grid-cols-[120px_1fr]" key={item.id}>
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-black">
                    <Image
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      fill
                      sizes="120px"
                      className="object-cover"
                    />
                  </div>
                  <div className="grid gap-3">
                    <div>
                      <h2 className="text-xl font-bold">{item.product.name}</h2>
                      <p className="text-sm text-[var(--muted)]">{centsToBRL(price)} cada</p>
                      <p className="mt-1 text-sm font-bold text-[var(--accent)]">
                        {centsToBRL(price * item.quantity)} no item
                      </p>
                    </div>
                    <CartActions
                      itemId={item.id}
                      maxQuantity={item.product.stock}
                      quantity={item.quantity}
                    />
                  </div>
                </article>
              );
            })}
          </section>
          <CartSummary
            couponCode={coupon?.code ?? null}
            discount={coupon ? centsToBRL(coupon.discountCents) : null}
            freightLabel={coupon && coupon.effectiveFreightCents === 0 ? "gratis" : "calculado no checkout"}
            subtotal={centsToBRL(subtotal)}
            total={centsToBRL(total)}
          />
        </div>
      )}
    </main>
  );
}
