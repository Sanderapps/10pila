import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { RegisterForm } from "@/components/auth-forms";

export default function RegisterPage() {
  return (
    <main className="container grid max-w-lg gap-5 py-12">
      <div>
        <BrandLogo animated variant="compact" className="mb-4 w-fit" />
        <p className="font-bold text-[var(--accent)]">cadastro</p>
        <h1 className="text-4xl font-black">Cria tua conta</h1>
      </div>
      <RegisterForm />
      <p className="text-sm text-[var(--muted)]">
        Ja tem login?{" "}
        <Link className="text-[var(--accent)]" href="/auth/login">
          Entrar
        </Link>
      </p>
    </main>
  );
}
