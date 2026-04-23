import Link from "next/link";
import { BoltIcon, ShieldIcon } from "@/components/icons";

export default function TermsPage() {
  return (
    <main className="container grid gap-8 py-10">
      <section className="panel grid gap-5 p-6">
        <p className="eyebrow">
          <ShieldIcon />
          termos
        </p>
        <div className="grid gap-3">
          <h1 className="text-balance text-4xl font-black md:text-5xl">Termos de uso</h1>
          <p className="max-w-3xl text-[var(--muted)]">
            Regras basicas para usar o 10PILA enquanto o MVP evolui no Railway.
          </p>
        </div>
      </section>

      <section className="grid gap-4">
        <article className="panel grid gap-3 p-5">
          <BoltIcon className="size-5 text-[var(--accent)]" />
          <h2 className="text-2xl font-bold">Conta e acesso</h2>
          <p className="text-[var(--muted)]">
            Para comprar, voce precisa estar logado. O acesso pode ser por email e senha, Google ou
            Facebook quando as credenciais OAuth estiverem configuradas.
          </p>
        </article>

        <article className="panel grid gap-3 p-5">
          <BoltIcon className="size-5 text-[var(--accent)]" />
          <h2 className="text-2xl font-bold">Produtos, estoque e pedidos</h2>
          <p className="text-[var(--muted)]">
            Preco, promocao e estoque exibidos devem vir do banco da loja. O pedido so representa
            uma compra em andamento ate o pagamento ser confirmado pelo gateway.
          </p>
        </article>

        <article className="panel grid gap-3 p-5">
          <BoltIcon className="size-5 text-[var(--accent)]" />
          <h2 className="text-2xl font-bold">Pagamento</h2>
          <p className="text-[var(--muted)]">
            O pagamento usa checkout hospedado do PagBank. O fluxo pode evoluir, mas a ideia atual e
            manter a conclusao do pagamento em ambiente seguro e separado da vitrine da loja.
          </p>
        </article>

        <article className="panel grid gap-3 p-5">
          <BoltIcon className="size-5 text-[var(--accent)]" />
          <h2 className="text-2xl font-bold">Chat</h2>
          <p className="text-[var(--muted)]">
            O chat ajuda a encontrar produtos e consultar pedidos do usuario logado. Ele pode falhar
            ou responder de forma limitada quando faltar dado ou credencial externa.
          </p>
        </article>
      </section>

      <section className="panel flex flex-wrap items-center justify-between gap-3 p-5">
        <p className="text-[var(--muted)]">Leia tambem a politica de privacidade.</p>
        <div className="flex flex-wrap gap-3">
          <Link className="btn secondary" href="/data-deletion">
            Excluir dados
          </Link>
          <Link className="btn" href="/privacy">
            Ver privacidade
          </Link>
        </div>
      </section>
    </main>
  );
}
