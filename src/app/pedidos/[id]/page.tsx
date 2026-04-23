import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderSignalIllustration } from "@/components/brand-illustrations";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { centsToBRL } from "@/lib/utils/money";

export const dynamic = "force-dynamic";

type ShippingAddress = {
  recipient?: string;
  phone?: string;
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  district?: string;
  city?: string;
  state?: string;
};

function normalizeAddress(value: unknown): ShippingAddress | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as ShippingAddress;
}

function orderStatusMeta(status: string) {
  switch (status) {
    case "DELIVERED":
      return {
        label: "Entregue",
        tone: "text-[var(--accent)]",
        summary: "Pedido entregue. Fluxo fechado do jeito certo.",
        nextStep: "Se quiser repetir o achado, o caminho agora e montar o proximo carrinho."
      };
    case "SHIPPED":
      return {
        label: "Em envio",
        tone: "text-[var(--accent-2)]",
        summary: "Pedido despachado. Agora e trilho de entrega.",
        nextStep: "Acompanha por aqui e segura a proxima compra para quando esse pacote bater na porta."
      };
    case "PROCESSING":
      return {
        label: "Separando pedido",
        tone: "text-[var(--accent-2)]",
        summary: "Pagamento passou e o pedido entrou em separacao.",
        nextStep: "Agora a loja prepara o envio. O proximo salto e status de despacho."
      };
    case "PAID":
      return {
        label: "Pago",
        tone: "text-[var(--accent)]",
        summary: "Pedido pago. Confirmacao feita e trilho destravado.",
        nextStep: "O proximo passo e a loja puxar separacao e atualizar para processamento."
      };
    case "CANCELED":
      return {
        label: "Cancelado",
        tone: "text-[var(--danger)]",
        summary: "Pedido cancelado. O historico fica salvo sem perder o rastro.",
        nextStep: "Se ainda quiser os itens, vale montar o pedido de novo com o carrinho revisado."
      };
    case "AWAITING_PAYMENT":
      return {
        label: "Aguardando pagamento",
        tone: "text-[var(--warning)]",
        summary: "Pedido salvo, mas o pagamento ainda nao virou confirmacao.",
        nextStep: "Abrir o checkout do PagBank e concluir o pagamento e o caminho mais curto."
      };
    default:
      return {
        label: "Pendente",
        tone: "text-[var(--warning)]",
        summary: "Pedido criado e aguardando o proximo passo do fluxo.",
        nextStep: "Se houver link de pagamento, conclui ele primeiro para destravar o resto."
      };
  }
}

function paymentStatusMeta(status: string) {
  switch (status) {
    case "APPROVED":
      return {
        label: "Pagamento aprovado",
        tone: "text-[var(--accent)]",
        summary: "Pagamento confirmado. Agora o pedido segue para separacao."
      };
    case "REJECTED":
      return {
        label: "Pagamento recusado",
        tone: "text-[var(--danger)]",
        summary: "O gateway recusou o pagamento. Vale revisar e tentar de novo."
      };
    case "CANCELED":
      return {
        label: "Pagamento cancelado",
        tone: "text-[var(--danger)]",
        summary: "Fluxo de pagamento cancelado. O pedido continua salvo no historico."
      };
    case "REFUNDED":
      return {
        label: "Pagamento estornado",
        tone: "text-[var(--warning)]",
        summary: "O valor foi estornado e o pedido precisa ser tratado como encerrado."
      };
    default:
      return {
        label: "Pagamento pendente",
        tone: "text-[var(--accent-2)]",
        summary: "Pagamento aguardando confirmacao ou analise do gateway."
      };
  }
}

function stageState(orderStatus: string, paymentStatus: string) {
  const paymentDone = paymentStatus === "APPROVED";
  const processingDone = ["PROCESSING", "SHIPPED", "DELIVERED"].includes(orderStatus);
  const shippingDone = ["SHIPPED", "DELIVERED"].includes(orderStatus);
  const deliveredDone = orderStatus === "DELIVERED";

  const states = [
    {
      label: "Pagamento",
      detail: paymentDone ? "confirmado" : "pendente",
      active: !paymentDone,
      done: paymentDone
    },
    {
      label: "Separacao",
      detail: processingDone ? "em trilho" : "aguardando",
      active: paymentDone && !processingDone,
      done: processingDone
    },
    {
      label: "Envio",
      detail: shippingDone ? "despachado" : "ainda nao",
      active: processingDone && !shippingDone,
      done: shippingDone
    },
    {
      label: "Entrega",
      detail: deliveredDone ? "concluida" : "em aberto",
      active: shippingDone && !deliveredDone,
      done: deliveredDone
    }
  ];

  return states;
}

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id, userId: user.id },
    include: { items: true, payment: true }
  });

  if (!order) {
    notFound();
  }

  const paymentStatus = order.payment?.status ?? "PENDING";
  const paymentMeta = paymentStatusMeta(paymentStatus);
  const orderMeta = orderStatusMeta(order.status);
  const stages = stageState(order.status, paymentStatus);
  const shippingAddress = normalizeAddress(order.shippingAddress);
  const createdAtLabel = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(order.createdAt);

  return (
    <main className="container grid gap-8 py-10">
      <section className="commerce-hero-panel panel overflow-hidden p-5 md:p-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_280px] lg:items-center">
          <div className="grid gap-3">
            <p className="eyebrow">pedido</p>
            <div className="grid gap-2">
              <h1 className="text-4xl font-black">Pedido {order.id.slice(0, 8)}</h1>
              <p className="max-w-2xl text-sm text-[var(--muted)]">
                {orderMeta.summary} {paymentMeta.summary}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className={`chip ${orderMeta.tone}`}>{orderMeta.label}</span>
              <span className={`chip ${paymentMeta.tone}`}>{paymentMeta.label}</span>
              <span className="chip bg-black/40">criado em {createdAtLabel}</span>
            </div>
          </div>
          <div className="grid gap-3 rounded-lg border border-[var(--line)] bg-black/20 p-4">
            <p className="text-sm font-bold text-[var(--accent)]">Proximo passo</p>
            <p className="text-sm text-[var(--muted)]">{orderMeta.nextStep}</p>
            <div className="flex flex-wrap gap-2">
              {order.payment?.checkoutUrl && paymentStatus !== "APPROVED" ? (
                <Link className="btn w-fit" href={order.payment.checkoutUrl}>
                  Abrir pagamento
                </Link>
              ) : null}
              <Link className="btn secondary w-fit" href="/produtos">
                Continuar comprando
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {stages.map((stage) => (
          <article className="panel grid gap-2 p-4" key={stage.label}>
            <div className="flex items-center justify-between gap-3">
              <strong>{stage.label}</strong>
              <span
                className={`inline-flex size-8 items-center justify-center rounded-full border text-xs font-black ${
                  stage.done
                    ? "border-[var(--accent)] bg-[rgba(61,245,165,0.12)] text-[var(--accent)]"
                    : stage.active
                      ? "border-[var(--accent-2)] bg-[rgba(85,200,255,0.12)] text-[var(--accent-2)]"
                      : "border-[var(--line)] bg-black/30 text-[var(--muted)]"
                }`}
              >
                {stage.done ? "OK" : stage.active ? "..." : "•"}
              </span>
            </div>
            <p className="text-sm text-[var(--muted)]">{stage.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="panel grid gap-4 p-5 md:p-6">
          <div className="mb-1 flex items-center gap-3">
            <OrderSignalIllustration className="size-18" />
            <div className="grid gap-1">
              <p className="text-sm font-black uppercase text-[var(--accent-2)]">pedido em trilho</p>
              <p className="text-sm text-[var(--muted)]">
                Pagamento, itens, entrega e acompanhamento no mesmo painel.
              </p>
            </div>
          </div>
          <div className="grid gap-2">
            <h2 className="text-2xl font-bold">Itens do pedido</h2>
            <p className="text-sm text-[var(--muted)]">
              Aqui fica o resumo fechado do que entrou no pedido, sem depender do carrinho atual.
            </p>
          </div>
          <div className="grid gap-3">
            {order.items.map((item) => (
              <div
                className="grid gap-3 rounded-lg border border-[var(--line)] bg-black/20 p-4 md:grid-cols-[1fr_auto]"
                key={item.id}
              >
                <div>
                  <p className="font-bold">{item.name}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {item.quantity}x {centsToBRL(item.unitCents)}
                  </p>
                </div>
                <strong className="text-[var(--foreground)]">{centsToBRL(item.totalCents)}</strong>
              </div>
            ))}
          </div>
        </div>

        <aside className="grid gap-4">
          <article className="commerce-flow-card panel grid gap-3 p-5">
            <p className="text-sm font-bold text-[var(--accent)]">Resumo financeiro</p>
            <div className="grid gap-2 text-sm">
              <p className="flex justify-between">
                <span>Subtotal</span>
                <strong>{centsToBRL(order.subtotalCents)}</strong>
              </p>
              {order.productDiscountCents > 0 ? (
                <p className="flex justify-between text-[var(--accent)]">
                  <span>Desconto nos produtos{order.couponCode ? ` (${order.couponCode})` : ""}</span>
                  <strong>- {centsToBRL(order.productDiscountCents)}</strong>
                </p>
              ) : null}
              {order.freightDiscountCents > 0 ? (
                <p className="flex justify-between text-[var(--accent-2)]">
                  <span>Desconto no frete{order.couponCode ? ` (${order.couponCode})` : ""}</span>
                  <strong>- {centsToBRL(order.freightDiscountCents)}</strong>
                </p>
              ) : null}
              <p className="flex justify-between">
                <span>Frete</span>
                <strong>{centsToBRL(order.freightCents - order.freightDiscountCents)}</strong>
              </p>
            </div>
            <div className="rounded-lg border border-[var(--line)] bg-black/20 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Total do pedido</p>
              <p className="mt-1 text-3xl font-black text-[var(--accent)]">{centsToBRL(order.totalCents)}</p>
            </div>
            <div className="grid gap-2 text-sm text-[var(--muted)]">
              <span className="chip">pedido salvo no historico</span>
              <span className="chip">pagamento amarrado ao pedido</span>
              <span className="chip">status atualizado por aqui</span>
            </div>
          </article>

          <article className="commerce-flow-card panel grid gap-3 p-5">
            <p className="text-sm font-bold text-[var(--accent-2)]">Entrega</p>
            {shippingAddress ? (
              <div className="grid gap-2 text-sm text-[var(--muted)]">
                <p>
                  <strong className="text-[var(--foreground)]">
                    {shippingAddress.recipient ?? order.customerName}
                  </strong>
                </p>
                <p>{shippingAddress.phone ?? "Telefone sem registro"}</p>
                <p>
                  {shippingAddress.street ?? "Endereco indisponivel"}, {shippingAddress.number ?? "s/n"}
                </p>
                {shippingAddress.complement ? <p>{shippingAddress.complement}</p> : null}
                <p>
                  {shippingAddress.district ?? "-"} | {shippingAddress.city ?? "-"} - {shippingAddress.state ?? "-"}
                </p>
                <p>CEP {shippingAddress.zipCode ?? "-"}</p>
              </div>
            ) : (
              <p className="text-sm text-[var(--muted)]">
                O endereco do pedido foi salvo, mas nao voltou num formato legivel para esta tela.
              </p>
            )}
          </article>

          <article className="panel grid gap-3 p-5">
            <p className="text-sm font-bold text-[var(--accent-2)]">Pagamento</p>
            <p className={`text-xl font-black ${paymentMeta.tone}`}>{paymentMeta.label}</p>
            <p className="text-sm text-[var(--muted)]">{paymentMeta.summary}</p>
            <div className="flex flex-wrap gap-2">
              {order.payment?.checkoutUrl && paymentStatus !== "APPROVED" ? (
                <Link className="btn w-fit" href={order.payment.checkoutUrl}>
                  Retomar pagamento
                </Link>
              ) : null}
              <Link className="btn secondary w-fit" href="/checkout">
                Voltar ao checkout
              </Link>
            </div>
          </article>
        </aside>
      </section>
    </main>
  );
}
