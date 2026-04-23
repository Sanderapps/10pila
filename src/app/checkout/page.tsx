import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { OrderSignalIllustration } from "@/components/brand-illustrations";
import { CheckoutForm } from "@/components/checkout-form";
import { resolveCartCoupon } from "@/lib/commerce/cart-pricing";
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
  const coupon = await resolveCartCoupon(user.id, subtotal, freight);
  const effectiveFreight = coupon?.effectiveFreightCents ?? freight;
  const total = coupon?.totalCents ?? subtotal + freight;
  const paymentStatus = recentOrder?.payment?.status ?? "PENDING";
  const paymentStatusLabel =
    paymentStatus === "APPROVED"
      ? "Pagamento aprovado"
      : paymentStatus === "REJECTED"
        ? "Pagamento falhou"
        : paymentStatus === "CANCELED"
          ? "Pagamento cancelado"
          : paymentStatus === "PENDING"
            ? "Pagamento aguardando confirmacao"
            : "Pedido em processamento";
  const paymentNextStep =
    paymentStatus === "APPROVED"
      ? "Pedido confirmado. Agora o trilho e separacao, embalagem e envio."
      : paymentStatus === "REJECTED"
        ? "O pagamento nao fechou. Voce pode revisar o pedido e tentar novamente."
        : paymentStatus === "CANCELED"
          ? "Fluxo cancelado. O pedido segue salvo para voce decidir o proximo passo."
        : "O pagamento ainda esta em analise ou aguardando acao no gateway.";
  const statusTone =
    paymentStatus === "APPROVED"
      ? "text-[var(--accent)]"
      : paymentStatus === "REJECTED" || paymentStatus === "CANCELED"
        ? "text-[var(--danger)]"
        : "text-[var(--accent-2)]";

  return (
    <main className="container grid gap-8 py-10">
      <div className="commerce-hero-panel panel grid gap-2 overflow-hidden p-5 md:p-6">
        <p className="font-bold text-[var(--accent)]">checkout</p>
        <h1 className="text-4xl font-black">Fechar pedido</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Revise entrega, itens e total aqui dentro da 10PILA. O pagamento final acontece em ambiente seguro do
          PagBank, e depois o pedido volta para acompanhamento normal na sua conta.
        </p>
      </div>

      {recentOrder ? (
        <section className="panel order-return-shell grid gap-4 overflow-hidden p-5">
          <div className="order-return-backdrop" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">Retorno do pagamento</h2>
              <p className="text-[var(--muted)]">
                Pedido {recentOrder.id.slice(0, 8)} | {paymentStatusLabel}.
                {status ? ` Evento de retorno: ${status}.` : ""}
              </p>
            </div>
            <span className={`chip ${statusTone}`}>{recentOrder.status}</span>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="chip bg-black/40">pedido {recentOrder.id.slice(0, 8)}</span>
            <span className="chip bg-black/40">status {paymentStatusLabel.toLowerCase()}</span>
            <span className="chip bg-black/40">retorno 10PILA</span>
          </div>
          <div className="grid gap-4 lg:grid-cols-[120px_1fr] lg:items-center">
            <div className="grid place-items-center">
              <OrderSignalIllustration className="size-24" />
            </div>
            <div className="grid gap-2 text-sm text-[var(--muted)]">
              {recentOrder.productDiscountCents > 0 ? (
                <p>
                  Desconto nos produtos:{" "}
                  <strong className="text-[var(--accent)]">- {centsToBRL(recentOrder.productDiscountCents)}</strong>
                  {recentOrder.couponCode ? ` com ${recentOrder.couponCode}` : ""}
                </p>
              ) : null}
              {recentOrder.freightDiscountCents > 0 ? (
                <p>
                  Desconto no frete:{" "}
                  <strong className="text-[var(--accent-2)]">- {centsToBRL(recentOrder.freightDiscountCents)}</strong>
                  {recentOrder.couponCode ? ` com ${recentOrder.couponCode}` : ""}
                </p>
              ) : null}
              <p>
                Total do pedido: <strong className="text-[var(--foreground)]">{centsToBRL(recentOrder.totalCents)}</strong>
              </p>
              {recentOrder.discountCents > 0 &&
              recentOrder.productDiscountCents === 0 &&
              recentOrder.freightDiscountCents === 0 ? (
                <p>
                  Economia aplicada: <strong className="text-[var(--accent)]">- {centsToBRL(recentOrder.discountCents)}</strong>
                  {recentOrder.couponCode ? ` com ${recentOrder.couponCode}` : ""}
                </p>
              ) : null}
              <p>
                Proximo passo: <strong className="text-[var(--foreground)]">{paymentNextStep}</strong>
              </p>
              <p>
                A 10PILA te recebe de volta aqui para continuar o fluxo sem cara de saida seca do site. Pedido,
                pagamento e proximos passos ficam no mesmo trilho.
              </p>
            </div>
          </div>
          {recentOrder.payment?.checkoutUrl ? (
            <div className="flex flex-wrap gap-3">
              <Link className="btn w-fit" href={recentOrder.payment.checkoutUrl}>
                Voltar ao PagBank
              </Link>
              <Link className="btn secondary w-fit" href={`/pedidos/${recentOrder.id}`}>
                Acompanhar pedido
              </Link>
              <Link className="btn secondary w-fit" href="/produtos">
                Continuar comprando
              </Link>
            </div>
          ) : (
            <div className="grid gap-3">
              <p className="text-sm text-[var(--muted)]">
                Checkout PagBank estrutural salvo. O link real de pagamento aparece aqui quando o PagBank devolver a URL do checkout.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link className="btn secondary w-fit" href={`/pedidos/${recentOrder.id}`}>
                  Acompanhar pedido
                </Link>
                <Link className="btn secondary w-fit" href="/produtos">
                  Continuar comprando
                </Link>
              </div>
            </div>
          )}
        </section>
      ) : null}

      {items.length === 0 && !recentOrder ? (
        <EmptyState
          art={<OrderSignalIllustration className="size-24" />}
          eyebrow="checkout"
          title="Checkout aguardando itens"
          description="Sem item no carrinho, nao existe fechamento. Escolhe um produto e volta que o resumo entra no trilho."
          actions={
            <Link className="btn w-fit" href="/produtos">
              Ver catalogo
            </Link>
          }
        />
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
            items={items.map((item) => ({
              id: item.id,
              name: item.product.name,
              quantity: item.quantity,
              unitPrice: centsToBRL(item.product.promotionalCents ?? item.product.priceCents),
              totalPrice: centsToBRL((item.product.promotionalCents ?? item.product.priceCents) * item.quantity)
            }))}
            couponCode={coupon?.code ?? null}
            productDiscount={coupon?.productDiscountCents ? centsToBRL(coupon.productDiscountCents) : null}
            freightDiscount={coupon?.freightDiscountCents ? centsToBRL(coupon.freightDiscountCents) : null}
            subtotal={centsToBRL(subtotal)}
            freight={centsToBRL(effectiveFreight)}
            total={centsToBRL(total)}
          />
          <aside className="panel grid h-fit gap-3 p-5">
            <p className="text-sm font-bold text-[var(--accent)]">Resumo do fechamento</p>
            <p className="text-sm text-[var(--muted)]">
              Pedido revisavel antes do pagamento. Nada e cobrado aqui dentro dessa etapa.
            </p>
            <div className="grid gap-2 text-sm">
              <p className="flex justify-between">
                <span>Produtos</span>
                <strong>{centsToBRL(subtotal)}</strong>
              </p>
              {coupon?.productDiscountCents ? (
                <p className="flex justify-between text-[var(--accent)]">
                  <span>Desconto nos produtos ({coupon.code})</span>
                  <strong>- {centsToBRL(coupon.productDiscountCents)}</strong>
                </p>
              ) : null}
              {coupon?.freightDiscountCents ? (
                <p className="flex justify-between text-[var(--accent-2)]">
                  <span>Desconto no frete ({coupon.code})</span>
                  <strong>- {centsToBRL(coupon.freightDiscountCents)}</strong>
                </p>
              ) : null}
              <p className="flex justify-between">
                <span>Frete fixo</span>
                <strong>{centsToBRL(effectiveFreight)}</strong>
              </p>
            </div>
            <div className="rounded-lg border border-[var(--line)] bg-black/20 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Total final</p>
              <p className="mt-1 text-3xl font-black text-[var(--accent)]">{centsToBRL(total)}</p>
            </div>
            <div className="grid gap-2 text-sm text-[var(--muted)]">
              <span className="chip">estoque validado</span>
              <span className="chip">pedido revisavel antes do redirect</span>
              <span className="chip">pagamento seguro via PagBank</span>
              <span className="chip">retorno para acompanhar na 10PILA</span>
            </div>
          </aside>
        </div>
      ) : null}
    </main>
  );
}
