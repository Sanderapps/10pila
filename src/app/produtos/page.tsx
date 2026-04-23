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
                ? `Resultado direto para "${query}". Estoque real, preco baixo e caminho curto ate o produto.`
                : "Nao trata isso como estoque cru. Aqui a vitrine ja entra organizada por preco e por uso."}
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
        <form className="surface grid gap-3 p-3 md:grid-cols-[1fr_180px]">
          <label className="relative">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
            <input
              className="input pl-10 pr-14"
              defaultValue={query}
              name="q"
              placeholder="Buscar por cabo, suporte, luz, adaptador..."
            />
            <button
              aria-label="Buscar"
              className="absolute right-2 top-1/2 inline-flex min-h-9 min-w-9 -translate-y-1/2 items-center justify-center rounded-md border border-[var(--line)] bg-black/35 px-3 text-[var(--muted)] transition hover:border-[var(--line-strong)] hover:text-[var(--foreground)]"
              type="submit"
            >
              <SearchIcon className="size-4" />
            </button>
          </label>
          <select className="input" defaultValue={sort ?? ""} name="sort">
            <option value="">Destaques</option>
            <option value="price-asc">Menor preco</option>
            <option value="price-desc">Maior preco</option>
            <option value="stock">Mais estoque</option>
          </select>
        </form>
      </div>

      {products.length > 0 ? (
        <div className="grid gap-8">
          {browsingCatalog ? (
            <>
              <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                <article className="commerce-flow-card panel grid gap-4 p-5 md:p-6">
                  <div className="grid gap-2">
                    <p className="eyebrow">
                      <SparkIcon />
                      entrada mais facil
                    </p>
                    <h2 className="text-3xl font-black">Comeca pelos achados de ate R$ 9,90</h2>
                    <p className="max-w-2xl text-sm text-[var(--muted)]">
                      Esse e o recorte mais forte para clique rapido: cabo, suporte, limpeza e utilidade pequena que
                      resolve sem transformar compra simples em busca longa.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm text-[var(--muted)]">
                    <span className="chip">cabos</span>
                    <span className="chip">suportes</span>
                    <span className="chip">limpeza</span>
                    <span className="chip">mesa</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link className="btn" href="/produtos?sort=price-asc">
                      Puxar os mais baratos
                    </Link>
                    <Link className="btn secondary" href="/produtos?q=celular">
                      Ver acessorios de celular
                    </Link>
                  </div>
                </article>

                <aside className="panel grid h-fit gap-3 p-5 md:p-6">
                  <p className="eyebrow">atalhos</p>
                  <h2 className="text-2xl font-black">Se ja souber a dor, entra por aqui</h2>
                  <div className="grid gap-3">
                    <Link className="surface promo-guide-link grid gap-1 p-4" href="/produtos?q=celular">
                      <strong>Celular sem gambiarra</strong>
                      <span className="text-sm text-[var(--muted)]">Suporte, cabo, audio e adaptador sem trambolho.</span>
                    </Link>
                    <Link className="surface promo-guide-link grid gap-1 p-4" href="/produtos?q=organizador">
                      <strong>Mesa mais limpa</strong>
                      <span className="text-sm text-[var(--muted)]">Organizacao, clip e utilidade pequena para rotina.</span>
                    </Link>
                    <Link className="surface promo-guide-link grid gap-1 p-4" href="/produtos?q=mochila">
                      <strong>Mochila e viagem</strong>
                      <span className="text-sm text-[var(--muted)]">Miudeza util que cabe no corre do dia a dia.</span>
                    </Link>
                  </div>
                </aside>
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

              <section className="grid gap-5 lg:grid-cols-[1.12fr_0.88fr]">
                <div className="grid gap-5">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="eyebrow">recorte comercial</p>
                      <h2 className="text-3xl font-black">Celular, mesa e setup leve</h2>
                      <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
                        Depois do preco de entrada, esse e o recorte mais forte para resolver rotina sem complicar a compra.
                      </p>
                    </div>
                  </div>
                  <div className="grid-products">
                    {[...phoneFinds.slice(0, 2), ...deskFinds.slice(0, 4)].slice(0, 6).map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>

                <aside className="panel grid h-fit gap-4 p-5">
                  <p className="eyebrow">guia rapido</p>
                  <h2 className="text-2xl font-black">O resto entra como apoio</h2>
                  <p className="text-sm text-[var(--muted)]">
                    Preco baixo puxa o clique. Uso ajuda a decidir. O catalogo completo fica no final para quem quer
                    rodar o inventario inteiro.
                  </p>
                  <div className="grid gap-2 text-sm text-[var(--muted)]">
                    <span className="chip">preco primeiro</span>
                    <span className="chip">uso em seguida</span>
                    <span className="chip">catalogo inteiro no fim</span>
                  </div>
                </aside>
              </section>

              <section className="grid gap-5 lg:grid-cols-[0.88fr_1.12fr]">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="eyebrow">rotina rapida</p>
                    <h2 className="text-3xl font-black">Ate R$ 19,90 e uteis de mochila</h2>
                  <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
                    Esse bloco entra como repertorio complementar, nao como a primeira decisao da pagina.
                  </p>
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
                    Aqui entra o inventario completo. Antes dele, a loja ja te entrega atalhos para chegar mais rapido
                    no que faz sentido.
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
                    vitrine principal.
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
