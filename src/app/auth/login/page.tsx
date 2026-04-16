import Link from "next/link";
import { LoginForm } from "@/components/auth-forms";

export default function LoginPage() {
  return (
    <main className="container grid max-w-lg gap-5 py-12">
      <div>
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
