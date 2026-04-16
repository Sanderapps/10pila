export default function ProductLoading() {
  return (
    <main className="container grid gap-8 py-10 md:grid-cols-[1fr_0.9fr]">
      <div className="panel skeleton-block aspect-[4/3]" />
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
