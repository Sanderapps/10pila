import Link from "next/link";
import { SearchShelfIllustration } from "@/components/brand-illustrations";
import { ProductCard } from "@/components/product-card";
import { EmptyState } from "@/components/empty-state";
import { SearchIcon, SparkIcon } from "@/components/icons";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const { q, sort } = await searchParams;
  const query = q?.trim();
  const browsingCatalog = !query;
  const orderBy =
    sort === "price-asc"
      ? [{ promotionalCents: "asc" as const }, { priceCents: "asc" as const }]
      : sort === "price-desc"
        ? [{ promotionalCents: "desc" as const }, { priceCents: "desc" as const }]
        : sort === "stock"
          ? [{ stock: "desc" as const }]
          : [{ featured: "desc" as const }, { updatedAt: "desc" as const }];
  const [products, underTen, underTwenty, deskFinds, phoneFinds, backpackFinds] = await Promise.all([
    prisma.product.findMany({
      where: {
        active: true,
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } }
              ]
            }
          : {})
      },
      orderBy
    }),
    browsingCatalog
      ? prisma.product.findMany({
          where: {
            active: true,
            OR: [{ promotionalCents: { lte: 990 } }, { promotionalCents: null, priceCents: { lte: 990 } }]
          },
          orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
          take: 4
        })
      : Promise.resolve([]),
    browsingCatalog
      ? prisma.product.findMany({
          where: {
            active: true,
            OR: [{ promotionalCents: { lte: 1990 } }, { promotionalCents: null, priceCents: { lte: 1990 } }]
          },
          orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
          take: 4
        })
      : Promise.resolve([]),
    browsingCatalog
      ? prisma.product.findMany({
          where: { active: true, category: { in: ["Organização de Mesa", "Itens Curiosos de Setup"] } },
          orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
          take: 4
        })
      : Promise.resolve([]),
    browsingCatalog
      ? prisma.product.findMany({
          where: { active: true, category: "Acessórios de Celular" },
          orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
          take: 4
        })
      : Promise.resolve([]),
    browsingCatalog
      ? prisma.product.findMany({
          where: { active: true, category: { in: ["Carro e Viagem", "Viagem e Escritório"] } },
          orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
          take: 4
        })
      : Promise.resolve([])
  ]);

  const quickFilters = [
    { label: "ate R$ 9,90", href: "/produtos?sort=price-asc" },
    { label: "uteis de mesa", href: "/produtos?q=mesa" },
    { label: "celular sem gambiarra", href: "/produtos?q=celular" },
    { label: "mochila e viagem", href: "/produtos?q=mochila" },
    { label: "mais estoque", href: "/produtos?sort=stock" }
  ];

  return (
    <main className="container grid gap-8 py-10">
      <div className="grid gap-4">
        <p className="eyebrow">
          <SparkIcon />
          catalogo
        </p>
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <h1 className="text-4xl font-black">Garimpo tech do 10PILA</h1>
            <p className="mt-2 max-w-xl text-[var(--muted)]">
              {query
                ? `Resultado direto para "${query}". Estoque real, preco baixo e link limpo sem enrolacao.`
                : "Nao trata isso como estoque cru. Aqui o garimpo ja entra quebrado por uso, preco e achado que vale o clique."}
            </p>
          </div>
          <span className="chip">{products.length} item(ns)</span>
        </div>
        {browsingCatalog ? (
          <div className="flex flex-wrap gap-2">
            {quickFilters.map((filter) => (
              <Link className="chip transition hover:border-[var(--accent)] hover:text-[var(--accent)]" href={filter.href} key={filter.href}>
                {filter.label}
              </Link>
            ))}
          </div>
        ) : null}
        <form className="surface grid gap-3 p-3 md:grid-cols-[1fr_180px_auto]">
          <label className="relative">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
            <input
              className="input pl-10"
              defaultValue={query}
              name="q"
              placeholder="Buscar por cabo, suporte, luz, adaptador..."
            />
          </label>
          <select className="input" defaultValue={sort ?? ""} name="sort">
            <option value="">Destaques</option>
            <option value="price-asc">Menor preco</option>
            <option value="price-desc">Maior preco</option>
            <option value="stock">Mais estoque</option>
          </select>
          <button className="btn" type="submit">
            Buscar
          </button>
        </form>
      </div>

      {products.length > 0 ? (
        <div className="grid gap-8">
          {browsingCatalog ? (
            <>
              <section className="grid gap-4 md:grid-cols-3">
                <article className="promo-strip-card panel grid gap-2 p-5">
                  <p className="eyebrow">
                    <SparkIcon />
                    faixa rapida
                  </p>
                  <h2 className="text-2xl font-black">Achados ate R$ 9,90</h2>
                  <p className="text-sm text-[var(--muted)]">
                    Coisa pequena, util e facil de levar sem pensar duas vezes.
                  </p>
                  <Link className="btn secondary w-fit" href="/produtos?sort=price-asc">
                    Puxar os mais baratos
                  </Link>
                </article>
                <article className="promo-strip-card panel grid gap-2 p-5">
                  <p className="eyebrow">
                    <SparkIcon />
                    resolve rotina
                  </p>
                  <h2 className="text-2xl font-black">Celular sem gambiarra</h2>
                  <p className="text-sm text-[var(--muted)]">
                    Suporte, cabo, audio e acessorio rapido para resolver sem trambolho caro.
                  </p>
                  <Link className="btn secondary w-fit" href="/produtos?q=celular">
                    Ver acessorios
                  </Link>
                </article>
                <article className="promo-strip-card panel grid gap-2 p-5">
                  <p className="eyebrow">
                    <SparkIcon />
                    mochila e mesa
                  </p>
                  <h2 className="text-2xl font-black">Bugiganga util que fica</h2>
                  <p className="text-sm text-[var(--muted)]">
                    Organizacao, limpeza e utilidade pequena que melhora a rotina sem drama.
                  </p>
                  <Link className="btn secondary w-fit" href="/produtos?q=organizador">
                    Garimpar uteis
                  </Link>
                </article>
              </section>

              <section className="grid gap-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="eyebrow">entrada facil</p>
                    <h2 className="text-3xl font-black">Achados ate R$ 9,90</h2>
                  </div>
                  <Link className="btn secondary" href="/produtos?sort=price-asc">
                    Ver mais
                  </Link>
                </div>
                <div className="grid-products">
                  {underTen.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>

              <section className="grid gap-5 lg:grid-cols-3">
                <div className="grid gap-5 lg:col-span-2">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="eyebrow">recorte comercial</p>
                      <h2 className="text-3xl font-black">Celular, mesa e setup leve</h2>
                    </div>
                  </div>
                  <div className="grid-products">
                    {[...phoneFinds.slice(0, 2), ...deskFinds.slice(0, 4)].slice(0, 6).map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>

                <aside className="panel grid h-fit gap-3 p-5">
                  <p className="eyebrow">guia rapido</p>
                  <h2 className="text-2xl font-black">Comeca por aqui</h2>
                  <p className="text-sm text-[var(--muted)]">
                    Se a ideia e comprar sem rodar demais, entra pelos blocos de preco e uso. O catalogo completo fica
                    logo abaixo.
                  </p>
                  <div className="grid gap-2 text-sm text-[var(--muted)]">
                    <span className="chip">ate R$ 9,90 pra impulso honesto</span>
                    <span className="chip">ate R$ 19,90 pra resolver rotina</span>
                    <span className="chip">mesa e mochila pra utilidade real</span>
                    <span className="chip">busca direta se ja souber o que quer</span>
                  </div>
                </aside>
              </section>

              <section className="grid gap-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="eyebrow">rotina rapida</p>
                    <h2 className="text-3xl font-black">Ate R$ 19,90 e uteis de mochila</h2>
                  </div>
                </div>
                <div className="grid-products">
                  {[...underTwenty.slice(0, 2), ...backpackFinds.slice(0, 4)].slice(0, 6).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>

              <section className="grid gap-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="eyebrow">catalogo inteiro</p>
                    <h2 className="text-3xl font-black">Todos os achados</h2>
                    <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
                      Aqui entra o inventario completo. Antes dele, a loja ja te entrega atalhos para achar coisa util
                      mais rapido.
                    </p>
                  </div>
                </div>
                <div className="grid-products">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            </>
          ) : (
            <section className="grid gap-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">resultado</p>
                  <h2 className="text-3xl font-black">Achados para &quot;{query}&quot;</h2>
                  <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
                    Busca direta no estoque ativo. Se nao era bem isso, limpa o termo e volta para os recortes da
                    vitrine.
                  </p>
                </div>
                <Link className="btn secondary" href="/produtos">
                  Voltar para a vitrine
                </Link>
              </div>
              <div className="grid-products">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <EmptyState
          art={<SearchShelfIllustration className="size-24" />}
          eyebrow={
            <>
              <SparkIcon />
              busca
            </>
          }
          title="Radar sem sinal"
          description="Esse termo nao puxou nenhum achado do estoque. Tenta um nome mais curto, categoria ou outro tipo de bugiganga tech."
          actions={
            <>
              <Link className="btn secondary" href="/produtos">
                Limpar busca
              </Link>
              <Link className="btn" href="/">
                Ver destaques
              </Link>
            </>
          }
        />
      )}
    </main>
  );
}
