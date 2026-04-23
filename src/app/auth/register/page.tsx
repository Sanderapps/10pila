import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { RegisterForm } from "@/components/auth-forms";

export default async function RegisterPage({
  searchParams
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const initialReferralCode = resolvedSearchParams.ref?.trim().toUpperCase() ?? "";

  return (
    <main className="container grid max-w-lg gap-5 py-12 md:py-16">
      <div className="commerce-hero-panel panel grid gap-3 p-5 md:p-6">
        <BrandLogo animated variant="symbol" className="w-fit" />
        <p className="eyebrow">cadastro</p>
        <h1 className="text-4xl font-black">Criar conta</h1>
        <p className="max-w-md text-sm text-[var(--muted)]">
          Cadastre-se para comprar com mais facilidade, acompanhar pedidos e usar codigo de indicacao quando tiver.
        </p>
      </div>
      <RegisterForm initialReferralCode={initialReferralCode} />
      <p className="text-sm text-[var(--muted)]">
        Ja tem login?{" "}
        <Link className="text-[var(--accent)]" href="/auth/login">
          Entrar
        </Link>
      </p>
    </main>
  );
}
