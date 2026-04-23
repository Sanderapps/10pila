import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { LoginForm } from "@/components/auth-forms";

export default function LoginPage() {
  return (
    <main className="container grid max-w-lg gap-5 py-12 md:py-16">
      <div className="commerce-hero-panel panel grid gap-3 p-5 md:p-6">
        <BrandLogo animated variant="symbol" className="w-fit" />
        <p className="eyebrow">login</p>
        <h1 className="text-4xl font-black">Entra na conta</h1>
        <p className="max-w-md text-sm text-[var(--muted)]">
          Acompanha pedido, fecha compra mais rapido e guarda teus atalhos da 10PILA no mesmo lugar.
        </p>
      </div>
      <LoginForm />
      <div className="surface grid gap-2 p-4 text-sm text-[var(--muted)]">
        <strong className="text-[var(--foreground)]">Ainda sem conta?</strong>
        <p>Cria teu cadastro para salvar pedido, usar indicacao e voltar pro carrinho sem perder o fio.</p>
        <Link className="text-[var(--accent)]" href="/auth/register">
          Criar cadastro
        </Link>
      </div>
    </main>
  );
}
