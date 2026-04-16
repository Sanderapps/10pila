export default function ProductLoading() {
  return (
    <main className="container grid gap-8 py-10 md:grid-cols-[1fr_0.9fr]">
      <div className="panel aspect-[4/3] animate-pulse bg-white/10" />
      <section className="grid content-start gap-5">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-white/10" />
        <div className="h-12 w-full animate-pulse rounded-lg bg-white/10" />
        <div className="h-20 animate-pulse rounded-lg bg-white/10" />
        <div className="surface h-24 animate-pulse" />
        <div className="h-12 w-full animate-pulse rounded-lg bg-white/10" />
      </section>
    </main>
  );
}
