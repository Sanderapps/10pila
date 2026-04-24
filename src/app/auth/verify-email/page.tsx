import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { EmailVerificationPanel } from "@/components/email-verification-panel";
import { verifyEmailToken } from "@/lib/auth/email-verification";

type VerifyEmailPageProps = {
  searchParams: Promise<{
    token?: string;
    email?: string;
    delivery?: string;
    verified?: string;
  }>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;
  const token = params.token?.trim();
  const email = params.email?.trim().toLowerCase() ?? "";
  const delivery = params.delivery?.trim();
  const verified = params.verified?.trim();

  const verification = token ? await verifyEmailToken(token) : null;

  if (verification?.ok) {
    redirect(`/auth/verify-email?verified=1&email=${encodeURIComponent(verification.email)}`);
  }

  return (
    <main className="container grid max-w-lg gap-5 py-12 md:py-16">
      <div className="commerce-hero-panel panel grid gap-3 p-5 md:p-6">
        <BrandLogo animated variant="symbol" className="w-fit" />
        <p className="eyebrow">confirmacao</p>
        <h1 className="text-4xl font-black">Confirmar email</h1>
        <p className="max-w-md text-sm text-[var(--muted)]">
          {verification?.ok
            ? "Seu login por email e senha esta liberado."
            : "A conta por email so fica pronta depois do clique no link enviado para sua caixa de entrada."}
        </p>
      </div>

      {verified === "1" ? (
        <div className="panel grid gap-4 p-5 md:p-6">
          <p className="text-sm font-bold text-[var(--foreground)]">Email confirmado com sucesso.</p>
          <p className="text-sm text-[var(--muted)]">Agora voce ja pode entrar normalmente e continuar sua compra.</p>
          <Link className="btn min-h-11" href="/auth/login">
            Ir para login
          </Link>
        </div>
      ) : verification?.code === "EXPIRED" ? (
        <>
          <div className="panel grid gap-3 p-5 md:p-6">
            <p className="text-sm font-bold text-[var(--foreground)]">Esse link expirou.</p>
            <p className="text-sm text-[var(--muted)]">Pede um novo link e confirma com o email mais recente.</p>
          </div>
          <EmailVerificationPanel initialEmail={verification.email ?? email} />
        </>
      ) : verification?.code === "INVALID" ? (
        <>
          <div className="panel grid gap-3 p-5 md:p-6">
            <p className="text-sm font-bold text-[var(--foreground)]">Esse link nao bate com uma confirmacao valida.</p>
            <p className="text-sm text-[var(--muted)]">Se sua conta estiver pendente, reenviamos outro link abaixo.</p>
          </div>
          <EmailVerificationPanel initialEmail={email} />
        </>
      ) : (
        <>
          <div className="panel grid gap-3 p-5 md:p-6">
            <p className="text-sm font-bold text-[var(--foreground)]">
              {delivery === "failed" ? "Conta criada, mas o envio falhou." : "Confira seu email."}
            </p>
            <p className="text-sm text-[var(--muted)]">
              {delivery === "failed"
                ? "O cadastro entrou, mas nao conseguimos disparar o primeiro email. Reenvie abaixo."
                : email
                  ? `Mandamos um link de confirmacao para ${email}.`
                  : "Mandamos um link de confirmacao para o email informado no cadastro."}
            </p>
          </div>
          <EmailVerificationPanel initialEmail={email} />
        </>
      )}
    </main>
  );
}
