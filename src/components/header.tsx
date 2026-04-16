import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { AccountButton } from "@/components/account-button";
import { BrandLogo } from "@/components/brand-logo";
import { CartIcon } from "@/components/icons";

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-black/45 backdrop-blur-xl">
      <div className="container flex min-h-[68px] items-center justify-between gap-3 py-3 md:min-h-16 md:gap-4">
        <Link href="/" className="header-brand transition hover:opacity-100">
          <BrandLogo animated className="opacity-95" />
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-2 text-[0.82rem] text-[var(--muted)] sm:gap-3 sm:text-sm">
          <Link className="nav-link" href="/produtos">
            Produtos
          </Link>
          <Link className="nav-link flex items-center gap-1" href="/carrinho">
            <CartIcon className="size-4" />
            Carrinho
          </Link>
          {user ? (
            <Link className="nav-link" href="/indicacoes">
              Indique e ganhe
            </Link>
          ) : null}
          {user?.role === "ADMIN" ? <Link className="nav-link" href="/admin">Admin</Link> : null}
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
