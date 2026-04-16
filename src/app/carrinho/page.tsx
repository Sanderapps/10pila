import Image from "next/image";
import Link from "next/link";
import { CartActions } from "@/components/cart-actions";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { centsToBRL } from "@/lib/utils/money";

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

  return (
    <main className="container grid gap-8 py-10">
      <div>
        <p className="font-bold text-[var(--accent)]">carrinho</p>
        <h1 className="text-4xl font-black">Setup quase comprado</h1>
      </div>

      {items.length === 0 ? (
        <section className="panel grid gap-4 p-5">
          <p className="text-[var(--muted)]">Carrinho vazio. Sem item, sem loot.</p>
          <Link className="btn w-fit" href="/produtos">
            Ver produtos
          </Link>
        </section>
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
                    </div>
                    <CartActions itemId={item.id} quantity={item.quantity} />
                  </div>
                </article>
              );
            })}
          </section>
          <aside className="panel grid h-fit gap-4 p-5">
            <p className="text-sm text-[var(--muted)]">Subtotal</p>
            <p className="text-3xl font-black text-[var(--accent)]">{centsToBRL(subtotal)}</p>
            <Link className="btn" href="/checkout">
              Ir para checkout
            </Link>
          </aside>
        </div>
      )}
    </main>
  );
}
