import Link from "next/link";
import { ShieldIcon, SparkIcon } from "@/components/icons";

export default function PrivacyPage() {
  return (
    <main className="container grid gap-8 py-10">
      <section className="panel grid gap-5 p-6">
        <p className="eyebrow">
          <ShieldIcon />
          privacidade
        </p>
        <div className="grid gap-3">
          <h1 className="text-balance text-4xl font-black md:text-5xl">
            Politica de privacidade
          </h1>
          <p className="max-w-3xl text-[var(--muted)]">
            Esta politica explica, de forma direta, como o 10PILA usa dados no MVP da loja.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="panel grid gap-3 p-5">
          <SparkIcon className="size-5 text-[var(--accent)]" />
          <h2 className="text-2xl font-bold">Dados de conta</h2>
          <p className="text-[var(--muted)]">
            Usamos nome, email e senha criptografada para criar e acessar sua conta. Se voce
            entrar com Google ou Facebook, recebemos os dados basicos autorizados pelo provedor
            para login.
          </p>
        </article>

        <article className="panel grid gap-3 p-5">
          <SparkIcon className="size-5 text-[var(--accent)]" />
          <h2 className="text-2xl font-bold">Pedidos e entrega</h2>
          <p className="text-[var(--muted)]">
            Usamos dados de entrega e contato para registrar pedidos, calcular o fluxo de compra e
            acompanhar status operacional dentro da loja.
          </p>
        </article>

        <article className="panel grid gap-3 p-5">
          <SparkIcon className="size-5 text-[var(--accent)]" />
          <h2 className="text-2xl font-bold">Pagamentos</h2>
          <p className="text-[var(--muted)]">
            O checkout e feito em ambiente hospedado do PagBank. O 10PILA salva apenas dados
            estruturais do pedido e do status de pagamento retornado pelo gateway.
          </p>
        </article>

        <article className="panel grid gap-3 p-5">
          <SparkIcon className="size-5 text-[var(--accent)]" />
          <h2 className="text-2xl font-bold">Chat IA</h2>
          <p className="text-[var(--muted)]">
            O chat usa mensagens e contexto real da loja para responder sobre produtos, promocoes e
            pedidos do usuario logado. Ele nao deve acessar pedido de outra pessoa.
          </p>
        </article>
      </section>

      <section className="panel grid gap-3 p-5">
        <h2 className="text-2xl font-bold">Contato e ajustes</h2>
        <p className="text-[var(--muted)]">
          Como MVP, solicitacoes de correcao ou remocao de dados devem ser tratadas diretamente com
          a administracao da loja. Esta pagina pode evoluir conforme novos servicos forem ativados.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link className="btn secondary w-fit" href="/data-deletion">
            Excluir dados
          </Link>
          <Link className="btn w-fit" href="/terms">
            Ver termos
          </Link>
        </div>
      </section>
    </main>
  );
}
