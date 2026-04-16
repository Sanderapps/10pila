import { BrandLogo } from "@/components/brand-logo";
import { LoadingDropIllustration } from "@/components/brand-illustrations";

export default function ProductLoading() {
  return (
    <main className="container grid gap-8 py-10 md:grid-cols-[1fr_0.9fr]">
      <div className="product-loading-shell panel relative overflow-hidden p-3 md:p-4">
        <div className="product-loading-backdrop absolute inset-0" />
        <div className="product-loading-frame relative grid aspect-[4/3] overflow-hidden rounded-lg">
          <div className="product-loading-media absolute inset-0" />
          <div className="product-loading-vignette absolute inset-0" />
          <div className="absolute left-4 right-4 top-4 z-10 flex items-center justify-between gap-2">
            <span className="chip bg-black/60 text-[var(--accent)]">carregando drop</span>
            <span className="chip bg-black/60">10PILA checked</span>
          </div>
          <div className="product-loading-center relative z-10 grid place-items-center gap-4">
            <BrandLogo animated variant="symbol" className="product-loading-brand" />
            <LoadingDropIllustration className="loading-illustration size-28 md:size-32" />
            <div className="grid justify-items-center gap-1 text-center">
              <p className="text-sm font-black uppercase tracking-normal text-[var(--accent-2)]">
                Carregando o drop...
              </p>
              <p className="max-w-xs text-sm text-[var(--muted)]">
                Buscando preco, estoque real e midia do produto.
              </p>
            </div>
          </div>
          <div className="product-loading-scan absolute inset-x-0 bottom-0 h-16" />
        </div>
      </div>
      <section className="grid content-start gap-5">
        <div className="grid gap-3">
          <div className="eyebrow">
            <span className="product-loading-dot" />
            Preparando os detalhes...
          </div>
          <div className="skeleton-line h-12 w-[78%] max-w-xl" />
          <div className="grid gap-2">
            <div className="skeleton-line h-4 w-full max-w-xl" />
            <div className="skeleton-line h-4 w-[92%] max-w-lg" />
            <div className="skeleton-line h-4 w-[68%] max-w-md" />
          </div>
        </div>
        <div className="surface product-loading-price grid gap-3 p-4">
          <div className="skeleton-line h-4 w-28" />
          <div className="skeleton-line h-10 w-44" />
          <div className="skeleton-line h-4 w-56" />
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="skeleton-block h-10 rounded-lg" />
          <div className="skeleton-block h-10 rounded-lg" />
          <div className="skeleton-block h-10 rounded-lg" />
        </div>
        <div className="skeleton-block h-12 rounded-lg" />
        <div className="panel product-loading-specs grid gap-3 p-4">
          <div className="skeleton-line h-5 w-28" />
          <div className="skeleton-line h-4 w-full" />
          <div className="skeleton-line h-4 w-[94%]" />
          <div className="mt-2 grid gap-2 border-t border-[var(--line)] pt-3">
            <div className="flex justify-between gap-3">
              <div className="skeleton-line h-4 w-24" />
              <div className="skeleton-line h-4 w-28" />
            </div>
            <div className="flex justify-between gap-3">
              <div className="skeleton-line h-4 w-28" />
              <div className="skeleton-line h-4 w-20" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
