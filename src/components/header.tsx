import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { AccountButton } from "@/components/account-button";
import { CartIcon, SparkIcon } from "@/components/icons";

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-black/45 backdrop-blur-xl">
      <div className="container flex min-h-16 items-center justify-between gap-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-xl font-black tracking-normal">
          <span className="grid size-9 place-items-center rounded-lg border border-[var(--line)] bg-[var(--accent)] text-black">
            <SparkIcon className="size-5" />
          </span>
          <span>10PILA</span>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-3 text-sm text-[var(--muted)]">
          <Link className="transition hover:text-[var(--foreground)]" href="/produtos">
            Produtos
          </Link>
          <Link className="flex items-center gap-1 transition hover:text-[var(--foreground)]" href="/carrinho">
            <CartIcon className="size-4" />
            Carrinho
          </Link>
          {user?.role === "ADMIN" ? <Link href="/admin">Admin</Link> : null}
          {user ? (
            <AccountButton />
          ) : (
            <Link className="btn secondary" href="/auth/login">
              Entrar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
