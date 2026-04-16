export default function ProductsLoading() {
  return (
    <main className="container grid gap-8 py-10">
      <div className="grid gap-4">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-white/10" />
        <div className="h-12 w-full max-w-xl animate-pulse rounded-lg bg-white/10" />
        <div className="surface h-16 animate-pulse" />
      </div>
      <div className="grid-products">
        {Array.from({ length: 6 }).map((_, index) => (
          <div className="panel overflow-hidden" key={index}>
            <div className="aspect-[4/3] animate-pulse bg-white/10" />
            <div className="grid gap-3 p-4">
              <div className="h-5 animate-pulse rounded bg-white/10" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-white/10" />
              <div className="h-10 animate-pulse rounded bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
