import Image from "next/image";
import Link from "next/link";
import { CartOrbitIllustration } from "@/components/brand-illustrations";
import { CartActions } from "@/components/cart-actions";
import { CartSummary } from "@/components/cart-summary";
import { EmptyState } from "@/components/empty-state";
import { CartIcon } from "@/components/icons";
import { resolveCartPricing } from "@/lib/commerce/cart-pricing";
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
  const pricing = await resolveCartPricing(user.id, subtotal, freight);
  const total = pricing.totalCents;

  return (
    <main className="container grid gap-8 py-10 pb-32 lg:pb-10">
      <section className="commerce-hero-panel panel grid gap-4 overflow-hidden p-5 md:grid-cols-[1fr_auto] md:items-center md:p-6">
        <div className="grid gap-2">
          <p className="eyebrow">
            <CartIcon />
            carrinho
          </p>
          <h1 className="text-4xl font-black">Seu carrinho</h1>
          <p className="max-w-2xl text-sm text-[var(--muted)]">
            Confere os itens, ajusta quantidade se precisar e segue para o checkout quando estiver tudo certo.
          </p>
        </div>
        <div className="grid gap-2 text-sm text-[var(--muted)] md:min-w-[230px]">
          <span className="chip bg-black/40">{items.length} item(ns) no carrinho</span>
          <span className="chip bg-black/40">total parcial {centsToBRL(total)}</span>
        </div>
      </section>

      {items.length === 0 ? (
        <EmptyState
          art={<CartOrbitIllustration className="size-24" />}
          eyebrow={
            <>
              <CartIcon />
              carrinho
            </>
          }
          title="Seu carrinho ainda esta vazio"
          description="Ainda nao entrou nada aqui. Escolhe um produto e volta que o fechamento comeca daqui."
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
                <article className="cart-item-card commerce-flow-card panel grid gap-4 p-4 md:grid-cols-[120px_1fr]" key={item.id}>
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
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-bold">{item.product.name}</h2>
                        {item.product.category ? <span className="chip bg-black/40">{item.product.category}</span> : null}
                      </div>
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
            couponCode={pricing.code}
            discountTotal={pricing.discountCents ? centsToBRL(pricing.discountCents) : null}
            freightCampaignLabel={pricing.freightCampaignLabel}
            couponTouchesFreight={pricing.freightDiscountCents > pricing.freightCampaignDiscountCents}
            productDiscount={pricing.productDiscountCents ? centsToBRL(pricing.productDiscountCents) : null}
            freightDiscount={pricing.freightDiscountCents ? centsToBRL(pricing.freightDiscountCents) : null}
            freight={centsToBRL(pricing.effectiveFreightCents)}
            subtotal={centsToBRL(subtotal)}
            total={centsToBRL(total)}
          />
        </div>
      )}
    </main>
  );
}
