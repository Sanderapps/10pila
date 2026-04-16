import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { AccountButton } from "@/components/account-button";

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-[var(--line)] bg-black/30 backdrop-blur">
      <div className="container flex min-h-16 items-center justify-between gap-4 py-3">
        <Link href="/" className="text-xl font-black tracking-normal">
          10PILA
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-3 text-sm text-[var(--muted)]">
          <Link href="/produtos">Produtos</Link>
          <Link href="/carrinho">Carrinho</Link>
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
