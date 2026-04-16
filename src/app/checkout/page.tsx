import Link from "next/link";
import { CheckoutForm } from "@/components/checkout-form";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { centsToBRL, freightCents } from "@/lib/utils/money";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams
}: {
  searchParams: Promise<{ pedido?: string; status?: string }>;
}) {
  const user = await requireUser();
  const { pedido, status } = await searchParams;
  const items = await prisma.cartItem.findMany({
    where: { userId: user.id },
    include: { product: true }
  });
  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }]
  });

  const recentOrder = pedido
    ? await prisma.order.findFirst({
        where: { id: pedido, userId: user.id },
        include: { payment: true, items: true }
      })
    : null;

  const subtotal = items.reduce((total, item) => {
    const price = item.product.promotionalCents ?? item.product.priceCents;
    return total + price * item.quantity;
  }, 0);
  const freight = freightCents();

  return (
    <main className="container grid gap-8 py-10">
      <div>
        <p className="font-bold text-[var(--accent)]">checkout</p>
        <h1 className="text-4xl font-black">Fechar pedido</h1>
      </div>

      {recentOrder ? (
        <section className="panel grid gap-3 p-5">
          <h2 className="text-2xl font-bold">Pedido criado</h2>
          <p className="text-[var(--muted)]">
            Pedido {recentOrder.id.slice(0, 8)} esta com status {recentOrder.status}.
            {status ? ` Retorno do pagamento: ${status}.` : ""}
          </p>
          {recentOrder.payment?.checkoutUrl ? (
            <Link className="btn w-fit" href={recentOrder.payment.checkoutUrl}>
              Voltar ao PagBank
            </Link>
          ) : (
            <p className="text-sm text-[var(--muted)]">
              Checkout PagBank estrutural salvo. O redirecionamento fica disponivel quando o PagBank
              retornar uma URL de pagamento.
            </p>
          )}
        </section>
      ) : null}

      {items.length === 0 && !recentOrder ? (
        <section className="panel grid gap-4 p-5">
          <p className="text-[var(--muted)]">Seu carrinho esta vazio.</p>
          <Link className="btn w-fit" href="/produtos">
            Ver catalogo
          </Link>
        </section>
      ) : null}

      {items.length > 0 ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <CheckoutForm
            initialAddresses={addresses.map((address) => ({
              id: address.id,
              isDefault: address.isDefault,
              recipient: address.recipient,
              phone: address.phone,
              zipCode: address.zipCode,
              street: address.street,
              number: address.number,
              complement: address.complement ?? "",
              district: address.district,
              city: address.city,
              state: address.state
            }))}
          />
          <aside className="panel grid h-fit gap-3 p-5">
            <p className="text-sm text-[var(--muted)]">Resumo</p>
            <div className="grid gap-2 text-sm">
              <p className="flex justify-between">
                <span>Produtos</span>
                <strong>{centsToBRL(subtotal)}</strong>
              </p>
              <p className="flex justify-between">
                <span>Frete fixo</span>
                <strong>{centsToBRL(freight)}</strong>
              </p>
            </div>
            <p className="text-3xl font-black text-[var(--accent)]">
              {centsToBRL(subtotal + freight)}
            </p>
          </aside>
        </div>
      ) : null}
    </main>
  );
}
