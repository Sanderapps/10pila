import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { LoginForm } from "@/components/auth-forms";

export default function LoginPage() {
  return (
    <main className="container grid max-w-lg gap-5 py-12">
      <div>
        <BrandLogo animated variant="compact" className="mb-4 w-fit" />
        <p className="font-bold text-[var(--accent)]">login</p>
        <h1 className="text-4xl font-black">Entra na conta</h1>
      </div>
      <LoginForm />
      <p className="text-sm text-[var(--muted)]">
        Ainda sem conta?{" "}
        <Link className="text-[var(--accent)]" href="/auth/register">
          Criar cadastro
        </Link>
      </p>
    </main>
  );
}
