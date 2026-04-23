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
  const [featured, underTen, underTwenty, deskFinds, phoneFinds, activeProductsCount] = await Promise.all([
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
    }),
    prisma.product.count({
      where: { active: true }
    })
  ]);

  const spotlight = featured[0] ?? underTwenty[0] ?? deskFinds[0] ?? phoneFinds[0];
  const heroPoster = resolveHomePosterPath("hero-achados-tech") ?? spotlight?.imageUrl ?? null;
  const heroVideo = resolveHomeVideoPath("hero-achados-tech") ?? undefined;
  const promoPosterCheap =
    resolveHomePosterPath("promo-ate-9-90") ?? underTen[0]?.imageUrl ?? featured[1]?.imageUrl ?? heroPoster;
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
            Achados tech ate R$ 19,90. Coisa util, preco honesto, papo reto.
          </h1>
          <p className="max-w-xl text-lg text-[var(--muted)]">
            A 10PILA puxa cabo esperto, acessorio de celular, luz USB e bugiganga que resolve
            coisa pequena sem doer no bolso. Compra de impulso, mas com estoque na mao.
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
          <div className="grid gap-3 pt-2 sm:grid-cols-3">
            <div className="surface grid gap-1 p-4">
              <strong className="text-2xl font-black text-[var(--accent)]">{activeProductsCount}</strong>
              <span className="text-sm text-[var(--muted)]">achados ativos no catalogo</span>
            </div>
            <div className="surface grid gap-1 p-4">
              <strong className="text-2xl font-black text-[var(--accent-2)]">R$ 9,90</strong>
              <span className="text-sm text-[var(--muted)]">faixa de entrada pra clique rapido</span>
            </div>
            <div className="surface grid gap-1 p-4">
              <strong className="text-2xl font-black text-[var(--accent-3)]">R$ 19,90</strong>
              <span className="text-sm text-[var(--muted)]">onde mora boa parte do impulso honesto</span>
            </div>
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
                ? `${centsToBRL(productPrice(spotlight))} com estoque ativo. Coisa simples, util e facil de levar.`
                : "Produto com foto, estoque e preco vindo direto do banco."}
            </p>
            <div className="flex flex-wrap gap-2 pt-2 text-xs text-[var(--muted)]">
              <span className="chip brand-badge">bugiganga util</span>
              <span className="chip brand-badge">preco redondo</span>
              <span className="chip brand-badge">pode levar sem drama</span>
            </div>
          </div>
        </div>
      </section>

      <section className="container grid gap-4 pb-8 md:grid-cols-3">
        <article className="promo-strip-card panel grid gap-2 p-5">
          <p className="eyebrow">
            <BoltIcon />
            preco rapido
          </p>
          <h2 className="text-2xl font-black">Achados ate R$ 9,90</h2>
          <p className="text-sm text-[var(--muted)]">
            Cabo, clip, limpeza e organizacao que resolvem sem virar boleto serio.
          </p>
          <Link className="btn secondary w-fit" href="/produtos">
            Puxar os mais baratos
          </Link>
        </article>

        <article className="promo-strip-card panel grid gap-2 p-5">
          <p className="eyebrow">
            <SparkIcon />
            compra de impulso
          </p>
          <h2 className="text-2xl font-black">Achados ate R$ 19,90</h2>
          <p className="text-sm text-[var(--muted)]">
            Itens pequenos, curiosos e vendaveis pra mesa, mochila, celular e rotina sem tralha cara.
          </p>
          <Link className="btn secondary w-fit" href="/produtos">
            Ver vitrine honesta
          </Link>
        </article>

        <article className="promo-strip-card panel grid gap-2 p-5">
          <p className="eyebrow">
            <GiftIcon />
            primeira compra
          </p>
          <h2 className="text-2xl font-black">BEMVINDO10</h2>
          <p className="text-sm text-[var(--muted)]">
            Cupom de boas-vindas para empurrar o primeiro pedido sem DLC escondida.
          </p>
          <Link className="btn secondary w-fit" href="/carrinho">
            Testar no carrinho
          </Link>
        </article>
      </section>

      {heroPoster ? (
        <section className="container grid gap-4 pb-12 lg:grid-cols-[1.15fr_0.85fr]">
          <HomePromoVisual
            accentLabel="drop da semana"
            description="Mesa, cabo, celular e utilidade pequena numa vitrine que parece loja girando de verdade, nao pagina parada."
            eyebrow="vitrine viva"
            href="/produtos"
            mediaSrc={promoPosterWeekly ?? heroPoster}
            title="Bugigangas uteis que valem o clique"
          />
          <div className="grid gap-4">
            <HomePromoVisual
              accentLabel="ate R$ 9,90"
              compact
              description="Coisa pequena pra resolver rapido sem transformar compra simples em projeto."
              eyebrow="entrada facil"
              href="/produtos?sort=price-asc"
              mediaSrc={promoPosterCheap ?? heroPoster}
              title="Achados baratos de verdade"
            />
            <HomePromoVisual
              accentLabel="drops e novidades"
              compact
              description="Acessorio util, reposicao e garimpo esperto com cara de loja que roda toda semana."
              eyebrow="energia comercial"
              href={socialLinks[0]?.href ?? "/produtos"}
              mediaSrc={promoPosterSocial ?? heroPoster}
              title="Segue os achados e pega o drop cedo"
            />
          </div>
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

      <section className="container grid gap-4 pb-12 md:grid-cols-3">
        <article className="panel promo-micro-card grid gap-3 p-5">
          <p className="eyebrow">pra mesa</p>
          <h2 className="text-2xl font-black">Arruma fio, limpa tela e some com a bagunca</h2>
          <p className="text-sm text-[var(--muted)]">
            O lado mais forte da loja e resolver caos pequeno com item barato e util.
          </p>
          <Link className="btn secondary w-fit" href="/produtos?q=organizador">
            Ver itens de mesa
          </Link>
        </article>
        <article className="panel promo-micro-card grid gap-3 p-5">
          <p className="eyebrow">pra celular</p>
          <h2 className="text-2xl font-black">Suporte, audio e adaptador sem gambiarra</h2>
          <p className="text-sm text-[var(--muted)]">
            Acessorio rapido que resolve uso diario e ainda cabe no pedido sem culpa.
          </p>
          <Link className="btn secondary w-fit" href="/produtos?q=celular">
            Ver acessorios
          </Link>
        </article>
        <article className="panel promo-micro-card grid gap-3 p-5">
          <p className="eyebrow">pra mochila</p>
          <h2 className="text-2xl font-black">Miudeza boa pra levar e nao esquecer</h2>
          <p className="text-sm text-[var(--muted)]">
            Cabo, case, clip e utilidade compacta pra rotina, viagem e trampo leve.
          </p>
          <Link className="btn secondary w-fit" href="/produtos?q=mochila">
            Garimpar compactos
          </Link>
        </article>
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
            Seu amigo compra acima de R$ 50 e voce recebe um cupom unico de R$ 10. Simples, direto
            e sem programa de pontos fazendo malabarismo.
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
              Pega 3 itens uteis de ate R$ 19,90 e monta um pedido que realmente parece achado, nao
              carrinho de luxo perdido.
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
              Quando tiver canal social ativo, esse e o ponto pra puxar novidade, video curto,
              reposicao e promo. A ideia e manter a 10PILA com energia de achado que gira toda hora.
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
