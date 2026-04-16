import { ProductPulseIllustration } from "@/components/brand-illustrations";

export default function ProductLoading() {
  return (
    <main className="container grid gap-8 py-10 md:grid-cols-[1fr_0.9fr]">
      <div className="panel relative grid aspect-[4/3] place-items-center overflow-hidden">
        <div className="absolute inset-0 skeleton-block" />
        <ProductPulseIllustration className="loading-illustration relative z-10 size-28" />
      </div>
      <section className="grid content-start gap-5">
        <div className="skeleton-line h-8 w-32" />
        <div className="skeleton-line h-12 w-full" />
        <div className="skeleton-line h-20" />
        <div className="surface skeleton-block h-24" />
        <div className="skeleton-line h-12 w-full" />
      </section>
    </main>
  );
}
