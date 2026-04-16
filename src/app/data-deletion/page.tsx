import Link from "next/link";
import { ShieldIcon, SparkIcon } from "@/components/icons";

export default function DataDeletionPage() {
  return (
    <main className="container grid gap-8 py-10">
      <section className="panel grid gap-5 p-6">
        <p className="eyebrow">
          <ShieldIcon />
          exclusao de dados
        </p>
        <div className="grid gap-3">
          <h1 className="text-balance text-4xl font-black md:text-5xl">Solicitar exclusao de dados</h1>
          <p className="max-w-3xl text-[var(--muted)]">
            Enquanto o MVP evolui, a exclusao de conta e dados ainda e tratada por fluxo manual da
            operacao da loja.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="panel grid gap-3 p-5">
          <SparkIcon className="size-5 text-[var(--accent)]" />
          <h2 className="text-2xl font-bold">Como pedir</h2>
          <p className="text-[var(--muted)]">
            Envie a solicitacao com o email da conta e o assunto &quot;Excluir meus dados
            10PILA&quot; para o canal oficial de atendimento da loja. O pedido deve incluir o email
            da conta para validacao.
          </p>
        </article>

        <article className="panel grid gap-3 p-5">
          <SparkIcon className="size-5 text-[var(--accent)]" />
          <h2 className="text-2xl font-bold">O que entra na exclusao</h2>
          <p className="text-[var(--muted)]">
            Conta, enderecos salvos, sessoes ativas e historico relacionado ao uso da conta podem
            ser removidos ou anonimizados conforme obrigacoes operacionais e fiscais do pedido.
          </p>
        </article>
      </section>

      <section className="panel flex flex-wrap items-center justify-between gap-3 p-5">
        <p className="text-[var(--muted)]">
          Para o Meta App Dashboard, use esta pagina como URL publica de exclusao de dados.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link className="btn secondary" href="/privacy">
            Ver privacidade
          </Link>
          <Link className="btn" href="/terms">
            Ver termos
          </Link>
        </div>
      </section>
    </main>
  );
}
