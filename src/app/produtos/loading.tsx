import { SearchShelfIllustration } from "@/components/brand-illustrations";

export default function ProductsLoading() {
  return (
    <main className="container grid gap-8 py-10">
      <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-center">
        <div className="grid justify-items-start">
          <SearchShelfIllustration className="loading-illustration size-24" />
        </div>
        <div className="grid gap-4">
          <div className="skeleton-line h-8 w-32" />
          <div className="skeleton-line h-12 w-full max-w-xl" />
          <div className="surface skeleton-block h-16" />
        </div>
      </div>
      <div className="grid-products">
        {Array.from({ length: 6 }).map((_, index) => (
          <div className="skeleton-card panel overflow-hidden" key={index}>
            <div className="aspect-[4/3] skeleton-block" />
            <div className="grid gap-3 p-4">
              <div className="skeleton-line h-5" />
              <div className="skeleton-line h-4 w-3/4" />
              <div className="skeleton-line h-10" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
