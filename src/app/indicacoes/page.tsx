import Link from "next/link";
import { GiftIcon, SparkIcon } from "@/components/icons";
import { ReferralSharePanel } from "@/components/referral-share-panel";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { buildReferralLink, ensureUserReferralCode, referralRules } from "@/lib/commerce/referrals";
import { centsToBRL } from "@/lib/utils/money";

export const dynamic = "force-dynamic";

export default async function ReferralsPage() {
  const user = await requireUser();
  const code = await ensureUserReferralCode(user.id);
  const referralLink = buildReferralLink(code);
  const [sentReferrals, rewardCoupons] = await Promise.all([
    prisma.referral.findMany({
      where: { referrerId: user.id },
      include: {
        referredUser: {
          select: { name: true, email: true }
        },
        rewardCoupon: {
          select: { code: true, endsAt: true, active: true }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.coupon.findMany({
      where: {
        assignedUserId: user.id,
        code: { startsWith: "PILA10" }
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

  const rewardedCount = sentReferrals.filter((referral) => referral.status === "REWARDED").length;

  return (
    <main className="container grid gap-8 py-10">
      <section className="panel grid gap-5 p-6">
        <p className="eyebrow">
          <GiftIcon />
          indicacoes
        </p>
        <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr] md:items-end">
          <div className="grid gap-3">
            <h1 className="text-4xl font-black md:text-5xl">Indique um amigo e ganhe R$ 10</h1>
            <p className="max-w-3xl text-[var(--muted)]">
              Seu amigo entra pelo seu link, faz a primeira compra acima de{" "}
              {centsToBRL(referralRules.minOrderCents)} e voce recebe um cupom unico de{" "}
              {centsToBRL(referralRules.rewardCents)} para usar na loja.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-[var(--muted)]">
            <span className="chip">bonus valido por {referralRules.rewardValidityDays} dias</span>
            <span className="chip">um cupom por amigo aprovado</span>
            <span className="chip">uso de 1 cupom por pedido</span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-[1fr_320px]">
        <article className="panel grid gap-4 p-5">
          <ReferralSharePanel code={code} referralLink={referralLink} />
          <p className="text-sm text-[var(--muted)]">
            MVP atual: a vinculacao da indicacao entra no cadastro com email e senha usando esse
            link ou o codigo manual no formulario.
          </p>
        </article>

        <aside className="grid gap-4">
          <article className="panel grid gap-2 p-5">
            <span className="text-sm text-[var(--muted)]">Amigos indicados</span>
            <strong className="text-3xl font-black">{sentReferrals.length}</strong>
          </article>
          <article className="panel grid gap-2 p-5">
            <span className="text-sm text-[var(--muted)]">Bonus liberados</span>
            <strong className="text-3xl font-black">{rewardedCount}</strong>
          </article>
          <article className="panel grid gap-2 p-5">
            <span className="text-sm text-[var(--muted)]">Cupons seus</span>
            <strong className="text-3xl font-black">{rewardCoupons.length}</strong>
          </article>
        </aside>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <article className="panel grid gap-4 p-5">
          <div>
            <p className="eyebrow">
              <SparkIcon />
              status da campanha
            </p>
            <h2 className="text-3xl font-black">Quem entrou pelo seu link</h2>
          </div>
          {sentReferrals.length === 0 ? (
            <p className="text-[var(--muted)]">
              Ainda nao caiu ninguem por aqui. Manda seu link para aquele amigo que sempre compra
              bugiganga util sem pensar duas vezes.
            </p>
          ) : (
            <div className="grid gap-3">
              {sentReferrals.map((referral) => (
                <article className="surface grid gap-2 p-4" key={referral.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong>{referral.referredUser.name ?? referral.referredUser.email}</strong>
                    <span className="chip">
                      {referral.status === "REWARDED"
                        ? "bonus liberado"
                        : referral.status === "QUALIFIED"
                          ? "compra elegivel"
                          : "aguardando 1a compra"}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--muted)]">
                    {referral.status === "REWARDED" && referral.rewardCoupon
                      ? `Cupom ${referral.rewardCoupon.code} liberado ate ${
                          referral.rewardCoupon.endsAt
                            ? new Intl.DateTimeFormat("pt-BR").format(referral.rewardCoupon.endsAt)
                            : "prazo nao definido"
                        }.`
                      : `Cadastro atrelado ao codigo ${referral.referralCodeUsed}.`}
                  </p>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="panel grid gap-4 p-5">
          <div>
            <p className="eyebrow">
              <GiftIcon />
              seus cupons
            </p>
            <h2 className="text-3xl font-black">Recompensas geradas</h2>
          </div>
          {rewardCoupons.length === 0 ? (
            <p className="text-[var(--muted)]">
              Nenhum bonus caiu ainda. Quando o primeiro amigo fechar uma compra acima de{" "}
              {centsToBRL(referralRules.minOrderCents)}, o desconto aparece aqui.
            </p>
          ) : (
            <div className="grid gap-3">
              {rewardCoupons.map((coupon) => (
                <article className="surface flex flex-wrap items-center justify-between gap-3 p-4" key={coupon.id}>
                  <div className="grid gap-1">
                    <strong>{coupon.code}</strong>
                    <span className="text-sm text-[var(--muted)]">
                      Desconto de {centsToBRL(coupon.value ?? 0)} no carrinho.
                    </span>
                  </div>
                  <span className="chip">
                    {coupon.endsAt
                      ? `valido ate ${new Intl.DateTimeFormat("pt-BR").format(coupon.endsAt)}`
                      : "sem prazo"}
                  </span>
                </article>
              ))}
            </div>
          )}
          <Link className="btn w-fit" href="/produtos">
            Ver achados da loja
          </Link>
        </article>
      </section>
    </main>
  );
}
