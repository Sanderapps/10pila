import Link from "next/link";
import Image from "next/image";
import { BoltIcon, ShieldIcon, SparkIcon, TruckIcon } from "@/components/icons";
import { ProductCard } from "@/components/product-card";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featured = await prisma.product.findMany({
    where: { active: true },
    orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
    take: 6
  });

  return (
    <main>
      <section className="container grid gap-8 py-10 md:grid-cols-[1.05fr_0.95fr] md:items-center md:py-14">
        <div className="grid gap-6 float-in">
          <p className="eyebrow">
            <SparkIcon />
            Importados tech com estoque proprio
          </p>
          <h1 className="max-w-3xl text-5xl font-black leading-tight md:text-7xl">
            Gadget bom, preço direto, papo reto.
          </h1>
          <p className="max-w-xl text-lg text-[var(--muted)]">
            O 10PILA junta achadinhos tech, setup e utilidades importadas sem
            prometer milagre. O que aparece aqui vem do estoque da loja.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link className="btn shine" href="/produtos">
              Ver catalogo
            </Link>
            <Link className="btn secondary" href="/auth/register">
              Criar conta
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
              checkout sandbox
            </span>
          </div>
        </div>
        <div className="panel shine relative overflow-hidden p-4">
          <div className="absolute left-4 right-4 top-4 z-10 flex items-center justify-between">
            <span className="chip bg-black/60 text-[var(--accent)]">drop do dia</span>
            <span className="chip bg-black/60">10PILA checked</span>
          </div>
          {featured[0] ? (
            <Link href={`/produtos/${featured[0].slug}`}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-black">
                <Image
                  alt={featured[0].name}
                  className="object-cover transition duration-500 hover:scale-105"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 520px"
                  src={featured[0].imageUrl}
                />
              </div>
            </Link>
          ) : null}
          <div className="mt-4 grid gap-2">
            <p className="text-sm font-bold text-[var(--accent-2)]">curadoria rapida</p>
            <p className="text-2xl font-black">{featured[0]?.name ?? "Setup pronto para entrar"}</p>
            <p className="text-sm text-[var(--muted)]">
              Produto com foto, estoque e preço vindo direto do banco. Sem vitrine fantasma.
            </p>
          </div>
        </div>
      </section>

      <section className="container grid gap-5 pb-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">vitrine</p>
            <h2 className="text-3xl font-black">Produtos em destaque</h2>
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
    </main>
  );
}
