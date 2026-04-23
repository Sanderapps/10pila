import Link from "next/link";
import Image from "next/image";
import {
  BoltIcon,
  GiftIcon,
  InstagramIcon,
  ShieldIcon,
  SparkIcon,
  TikTokIcon,
  TruckIcon,
  WhatsAppIcon
} from "@/components/icons";
import { HeroMediaStage } from "@/components/hero-media-stage";
import { ProductCard } from "@/components/product-card";
import { getCurrentUser } from "@/lib/auth/session";
import { resolveHomePosterPath, resolveHomeVideoPath } from "@/lib/catalog/media";
import { prisma } from "@/lib/db/prisma";
import { centsToBRL } from "@/lib/utils/money";

export const dynamic = "force-dynamic";

function productPrice(product: {
  promotionalCents: number | null;
  priceCents: number;
}) {
  return product.promotionalCents ?? product.priceCents;
}

function HomePromoVisual({
  href,
  title,
  eyebrow,
  description,
  mediaSrc,
  accentLabel,
  compact = false
}: {
  href: string;
  title: string;
  eyebrow: string;
  description: string;
  mediaSrc: string;
  accentLabel: string;
  compact?: boolean;
}) {
  return (
    <Link
      className={`panel promo-visual-card group relative grid overflow-hidden ${compact ? "min-h-[280px]" : "min-h-[360px]"}`}
      href={href}
    >
      <div className="absolute inset-0">
        <Image
          alt={title}
          className="object-cover transition duration-700 group-hover:scale-[1.05]"
          fill
          sizes="(max-width: 768px) 100vw, 560px"
          src={mediaSrc}
        />
      </div>
      <div className="promo-visual-shade absolute inset-0" />
      <div className="promo-visual-grid absolute inset-0" />
      <div className="relative z-10 mt-auto grid gap-3 p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip bg-black/65">{eyebrow}</span>
          <span className="chip bg-black/65 text-[var(--accent-2)]">{accentLabel}</span>
        </div>
        <div className="grid gap-2">
          <h3 className={`${compact ? "text-2xl" : "text-3xl"} font-black`}>{title}</h3>
          <p className="max-w-xl text-sm text-[#d4deea]">{description}</p>
        </div>
        <span className="inline-flex w-fit items-center rounded-[8px] border border-[var(--line)] bg-black/45 px-3 py-2 text-sm font-black text-[var(--accent)]">
          Abrir vitrine
        </span>
      </div>
    </Link>
  );
}

export default async function HomePage() {
  const user = await getCurrentUser();
  const [featured, underTen, underTwenty, deskFinds, phoneFinds] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
      take: 6
    }),
    prisma.product.findMany({
      where: {
        active: true,
        OR: [{ promotionalCents: { lte: 990 } }, { promotionalCents: null, priceCents: { lte: 990 } }]
      },
      orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
      take: 4
    }),
    prisma.product.findMany({
      where: {
        active: true,
        OR: [{ promotionalCents: { lte: 1990 } }, { promotionalCents: null, priceCents: { lte: 1990 } }]
      },
      orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
      take: 4
    }),
    prisma.product.findMany({
      where: { active: true, category: "Organização de Mesa" },
      orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
      take: 4
    }),
    prisma.product.findMany({
      where: { active: true, category: "Acessórios de Celular" },
      orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
      take: 4
    })
  ]);

  const spotlight = featured[0] ?? underTwenty[0] ?? deskFinds[0] ?? phoneFinds[0];
  const heroPoster = resolveHomePosterPath("hero-achados-tech") ?? spotlight?.imageUrl ?? null;
  const heroVideo = resolveHomeVideoPath("hero-achados-tech") ?? undefined;
  const promoPosterUseful =
    resolveHomePosterPath("bugigangas-uteis") ?? deskFinds[0]?.imageUrl ?? featured[2]?.imageUrl ?? heroPoster;
  const promoPosterSocial =
    resolveHomePosterPath("social-drops-e-novidades") ?? phoneFinds[0]?.imageUrl ?? featured[3]?.imageUrl ?? heroPoster;
  const promoPosterReferral =
    resolveHomePosterPath("indique-e-ganhe-10") ?? underTwenty[1]?.imageUrl ?? featured[4]?.imageUrl ?? heroPoster;
  const promoPosterWeekly =
    resolveHomePosterPath("drop-da-semana") ?? featured[0]?.imageUrl ?? underTwenty[2]?.imageUrl ?? heroPoster;
  const secondaryCta =
    user?.role === "ADMIN"
      ? { href: "/admin", label: "Abrir admin" }
      : user
        ? { href: "/indicacoes", label: "Indique e ganhe" }
        : { href: "/auth/register", label: "Criar conta" };

  const socialLinks = [
    {
      href: process.env.NEXT_PUBLIC_INSTAGRAM_URL,
      label: "Instagram",
      note: "Drops, reels e achados da semana",
      icon: <InstagramIcon className="size-5" />
    },
    {
      href: process.env.NEXT_PUBLIC_TIKTOK_URL,
      label: "TikTok",
      note: "Demo rapida de bugiganga util",
      icon: <TikTokIcon className="size-5" />
    },
    {
      href: process.env.NEXT_PUBLIC_WHATSAPP_URL,
      label: "WhatsApp",
      note: "Canal direto para duvida e promo",
      icon: <WhatsAppIcon className="size-5" />
    }
  ].flatMap((item) => (item.href ? [{ ...item, href: item.href }] : []));

  return (
    <main>
      <section className="container grid gap-10 py-10 md:grid-cols-[1.02fr_0.98fr] md:items-center md:gap-12 md:py-14">
        <div className="hero-copy grid gap-6 float-in">
          <p className="eyebrow">
            <SparkIcon />
            achados baratos com estoque real
          </p>
          <h1 className="max-w-3xl text-5xl font-black leading-tight md:text-7xl">
            Coisa util, tech e barata. Do tipo que voce abre, olha e leva.
          </h1>
          <p className="max-w-xl text-lg text-[var(--muted)]">
            Cabo, acessorio de celular, luz USB, suporte e organizacao pra resolver as pequenas chatices do dia a dia
            sem gastar demais. Tudo com estoque real e caminho simples ate o checkout.
          </p>
          <div className="hero-cta-row flex flex-wrap gap-3">
            <Link className="btn shine" href="/produtos">
              Ver catalogo
            </Link>
            <Link className="btn secondary" href={secondaryCta.href}>
              {secondaryCta.label}
            </Link>
          </div>
          <div className="grid gap-3 text-sm text-[var(--muted)] sm:grid-cols-3">
            <span className="chip">
              <ShieldIcon />
              estoque real
            </span>
            <span className="chip">
              <TruckIcon />
              frete fixo
            </span>
            <span className="chip">
              <BoltIcon />
              compra rapida
            </span>
          </div>
        </div>

        <div className="hero-card panel shine relative overflow-hidden p-5 md:p-6">
          <div className="absolute left-4 right-4 top-4 z-10 flex items-center justify-between gap-2">
            <span className="chip brand-badge bg-black/60 text-[var(--accent)]">achado do dia</span>
            <span className="chip brand-badge bg-black/60">ate R$ 19,90</span>
          </div>
          {spotlight && heroPoster ? (
            <Link href={`/produtos/${spotlight.slug}`}>
              <HeroMediaStage alt={spotlight.name} posterSrc={heroPoster} priority videoSrc={heroVideo} />
            </Link>
          ) : null}
          <div className="mt-4 grid gap-2">
            <p className="text-sm font-bold text-[var(--accent-2)]">drop em destaque</p>
            <p className="text-2xl font-black">{spotlight?.name ?? "Achado pronto pra rodar"}</p>
            <p className="text-sm text-[var(--muted)]">
              {spotlight
                ? `${centsToBRL(productPrice(spotlight))} e pronto pra sair do estoque. Um item simples, util e facil de encaixar no pedido.`
                : "Produto com foto, estoque e preco vindo direto do banco."}
            </p>
            <div className="flex flex-wrap gap-2 pt-2 text-xs text-[var(--muted)]">
              <span className="chip brand-badge">utilidade real</span>
              <span className="chip brand-badge">preco redondo</span>
              <span className="chip brand-badge">compra facil</span>
            </div>
          </div>
        </div>
      </section>

      <section className="container grid gap-4 pb-8 md:grid-cols-[1.15fr_0.85fr]">
        <article className="promo-strip-card panel grid gap-3 p-5 md:p-6">
          <p className="eyebrow">
            <BoltIcon />
            comece pelo preco
          </p>
          <h2 className="text-3xl font-black">Achados de entrada, sem girar demais</h2>
          <p className="max-w-2xl text-sm text-[var(--muted)]">
            Se voce so quer encontrar uma coisinha util e seguir a vida, comeca por aqui. Tem cabo, clip, limpeza e
            organizacao com preco de item que entra no carrinho sem briga.
          </p>
          <div className="flex flex-wrap gap-2 text-sm text-[var(--muted)]">
            <span className="chip">cabos</span>
            <span className="chip">mesa</span>
            <span className="chip">limpeza tech</span>
            <span className="chip">celular</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link className="btn" href="/produtos?sort=price-asc">
              Puxar os mais baratos
            </Link>
            <Link className="btn secondary" href="/produtos">
              Ver catalogo inteiro
            </Link>
          </div>
        </article>

        <article className="promo-strip-card panel grid gap-3 p-5 md:p-6">
          <p className="eyebrow">
            <GiftIcon />
            primeira compra
          </p>
          <h2 className="text-2xl font-black">BEMVINDO10</h2>
          <p className="text-sm text-[var(--muted)]">
            Cupom de boas-vindas pra primeira compra ficar mais gostosa de fechar.
          </p>
          <div className="grid gap-2 text-sm text-[var(--muted)]">
            <span className="chip">primeiro pedido</span>
            <span className="chip">entrada simples</span>
          </div>
          <Link className="btn secondary w-fit" href="/carrinho">
            Testar no carrinho
          </Link>
        </article>
      </section>

      {heroPoster ? (
        <section className="container grid gap-4 pb-12 lg:grid-cols-[1.2fr_0.8fr]">
          <HomePromoVisual
            accentLabel="drop da semana"
            description="Mesa, cabo, celular e utilidade pequena numa vitrine que parece loja girando de verdade, nao pagina parada."
            eyebrow="vitrine viva"
            href="/produtos"
            mediaSrc={promoPosterWeekly ?? heroPoster}
            title="Bugigangas uteis que valem o clique"
          />
          <aside className="panel promo-guide-card grid gap-4 p-5 md:p-6">
            <div className="grid gap-2">
              <p className="eyebrow">atalho certo</p>
              <h2 className="text-3xl font-black">Entra por uso, nao por rolagem infinita</h2>
              <p className="text-sm text-[var(--muted)]">
                A vitrine principal mostra o clima da loja. Aqui do lado ficam os atalhos pra quem ja quer ir direto ao
                ponto sem rolar a pagina inteira.
              </p>
            </div>
            <div className="grid gap-3">
              <Link className="surface promo-guide-link grid gap-1 p-4" href="/produtos?sort=price-asc">
                <strong>Achados ate R$ 9,90</strong>
                <span className="text-sm text-[var(--muted)]">Entrada facil pra clicar sem pensar demais.</span>
              </Link>
              <Link className="surface promo-guide-link grid gap-1 p-4" href="/produtos?q=celular">
                <strong>Celular sem gambiarra</strong>
                <span className="text-sm text-[var(--muted)]">Suporte, audio e adaptador com recorte mais certeiro.</span>
              </Link>
              <Link
                className="surface promo-guide-link grid gap-1 p-4"
                href={socialLinks[0]?.href ?? "/produtos"}
              >
                <strong>Drops e novidades</strong>
                <span className="text-sm text-[var(--muted)]">Pra ver reposicao e achado novo mais cedo.</span>
              </Link>
            </div>
          </aside>
        </section>
      ) : null}

      <section className="container grid gap-5 pb-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">vitrine</p>
            <h2 className="text-3xl font-black">Achados em destaque</h2>
          </div>
          <Link className="btn secondary" href="/produtos">
            Todos
          </Link>
        </div>
        <div className="grid-products">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="container grid gap-5 pb-12 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="panel promo-micro-card grid gap-3 p-5 md:p-6">
          <p className="eyebrow">compra guiada</p>
          <h2 className="text-3xl font-black">Escolhe pelo que resolve, nao pelo excesso de card</h2>
          <p className="text-sm text-[var(--muted)]">
            A 10PILA funciona melhor quando voce entra por contexto. Mesa pra arrumar, celular pra resolver rapido,
            mochila pra nao esquecer o util.
          </p>
        </article>
        <div className="grid gap-4 md:grid-cols-3">
          <article className="panel promo-micro-card grid gap-3 p-5">
            <p className="eyebrow">pra mesa</p>
            <h2 className="text-2xl font-black">Arruma fio e limpa o caos pequeno</h2>
            <Link className="btn secondary w-fit" href="/produtos?q=organizador">
              Ver itens de mesa
            </Link>
          </article>
          <article className="panel promo-micro-card grid gap-3 p-5">
            <p className="eyebrow">pra celular</p>
            <h2 className="text-2xl font-black">Suporte, audio e adaptador sem trambolho</h2>
            <Link className="btn secondary w-fit" href="/produtos?q=celular">
              Ver acessorios
            </Link>
          </article>
          <article className="panel promo-micro-card grid gap-3 p-5">
            <p className="eyebrow">pra mochila</p>
            <h2 className="text-2xl font-black">Miudeza boa pra levar e lembrar</h2>
            <Link className="btn secondary w-fit" href="/produtos?q=mochila">
              Garimpar compactos
            </Link>
          </article>
        </div>
      </section>

      <section className="container grid gap-8 pb-12 lg:grid-cols-[1fr_1fr]">
        <div className="grid gap-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">precinho</p>
              <h2 className="text-3xl font-black">Achados ate R$ 9,90</h2>
            </div>
            <Link className="btn secondary" href="/produtos">
              Ver mais
            </Link>
          </div>
          <div className="grid-products">
            {underTen.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>

        <div className="grid gap-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">mesa e celular</p>
              <h2 className="text-3xl font-black">Uteis de mesa e acessorios rapidos</h2>
            </div>
            <Link className="btn secondary" href="/produtos">
              Garimpar
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[...deskFinds.slice(0, 2), ...phoneFinds.slice(0, 2)].map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="container grid gap-4 pb-12 md:grid-cols-[1.1fr_0.9fr]">
        <article className="panel promo-spotlight grid gap-3 p-5 md:p-6">
          <p className="eyebrow">
            <GiftIcon />
            campanha de indicacao
          </p>
          <h2 className="text-3xl font-black">Indique um amigo e ganhe R$ 10</h2>
          <p className="max-w-2xl text-[var(--muted)]">
            Se um amigo fizer a primeira compra acima de R$ 50, voce ganha R$ 10 em cupom. Simples de entender e bom
            de usar.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link className="btn" href={user ? "/indicacoes" : "/auth/register"}>
              {user ? "Abrir minha indicacao" : "Criar conta para indicar"}
            </Link>
            <Link className="btn secondary" href="/produtos">
              Ver achados da loja
            </Link>
          </div>
        </article>

        <article className="panel grid gap-3 overflow-hidden p-0">
          {promoPosterReferral ? (
            <div className="relative min-h-[220px]">
              <Image
                alt="Campanha de indicacao"
                className="object-cover"
                fill
                sizes="(max-width: 768px) 100vw, 520px"
                src={promoPosterReferral}
              />
              <div className="promo-visual-shade absolute inset-0" />
            </div>
          ) : null}
          <div className="grid gap-3 p-5 md:p-6">
            <p className="eyebrow">
              <SparkIcon />
              compra leve
            </p>
            <h2 className="text-3xl font-black">Combo leve sem enrolacao</h2>
            <p className="text-[var(--muted)]">
              Junta 3 itens uteis de ate R$ 19,90 e monta um pedido que faz sentido de verdade: um pouco de mesa, um
              pouco de celular, um pouco de organizacao.
            </p>
            <div className="grid gap-2 text-sm text-[var(--muted)]">
              <span className="chip">mesa</span>
              <span className="chip">celular</span>
              <span className="chip">cabos</span>
            </div>
          </div>
        </article>
      </section>

      <section className="container grid gap-4 pb-16 lg:grid-cols-[1fr_0.95fr]">
        <article className="panel grid gap-4 overflow-hidden p-0">
          {promoPosterSocial ? (
            <div className="relative min-h-[220px]">
              <Image
                alt="Drops e novidades"
                className="object-cover"
                fill
                sizes="(max-width: 768px) 100vw, 620px"
                src={promoPosterSocial}
              />
              <div className="promo-visual-shade absolute inset-0" />
            </div>
          ) : null}
          <div className="grid gap-4 p-5 md:p-6">
            <div>
              <p className="eyebrow">
                <TruckIcon />
                lojas vivas
              </p>
              <h2 className="text-3xl font-black">Acompanha os drops e novidades</h2>
            </div>
            <p className="max-w-2xl text-[var(--muted)]">
              Aqui entra novidade, reposicao e promocao. A ideia e fazer a 10PILA parecer uma loja que esta sempre
              girando, nao uma vitrine parada.
            </p>
            {socialLinks.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-3">
                {socialLinks.map((social) => (
                  <a
                    className="surface social-card grid gap-2 p-4 transition hover:border-[var(--accent-2)]"
                    href={social.href}
                    key={social.label}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <span className="inline-flex size-10 items-center justify-center rounded-lg border border-[var(--line)] bg-black/30 text-[var(--accent-2)]">
                      {social.icon}
                    </span>
                    <strong>{social.label}</strong>
                    <span className="text-sm text-[var(--muted)]">{social.note}</span>
                  </a>
                ))}
              </div>
            ) : (
              <div className="surface grid gap-3 p-4">
                <strong>Instagram, TikTok e WhatsApp entram aqui.</strong>
                <p className="text-sm text-[var(--muted)]">
                  A estrutura esta pronta. Basta preencher os links publicos da loja no ambiente para
                  esse bloco virar canal de venda e novidade.
                </p>
              </div>
            )}
          </div>
        </article>

        <article className="panel grid gap-4 overflow-hidden p-0">
          {promoPosterUseful ? (
            <div className="relative min-h-[220px]">
              <Image
                alt="Vitrine ate R$ 19,90"
                className="object-cover"
                fill
                sizes="(max-width: 768px) 100vw, 560px"
                src={promoPosterUseful}
              />
              <div className="promo-visual-shade absolute inset-0" />
            </div>
          ) : null}
          <div className="grid gap-4 p-5 md:p-6">
            <div>
              <p className="eyebrow">
                <SparkIcon />
                vitrine rapida
              </p>
              <h2 className="text-3xl font-black">Achados ate R$ 19,90</h2>
            </div>
            <div className="grid gap-3">
              {underTwenty.slice(0, 3).map((product) => (
                <Link
                  className="surface grid grid-cols-[68px_1fr_auto] items-center gap-3 p-3 transition hover:border-[var(--accent)]"
                  href={`/produtos/${product.slug}`}
                  key={product.id}
                >
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-black">
                    <Image alt={product.name} className="object-cover" fill sizes="68px" src={product.imageUrl} />
                  </div>
                  <div className="grid gap-1">
                    <strong>{product.name}</strong>
                    <span className="text-sm text-[var(--muted)]">{product.category ?? "achado tech"}</span>
                  </div>
                  <strong className="text-[var(--accent)]">{centsToBRL(productPrice(product))}</strong>
                </Link>
              ))}
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
