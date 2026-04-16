"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { StatusMessage } from "@/components/status-message";

type CartSummaryProps = {
  subtotal: string;
  freightLabel: string;
  total: string;
  discount?: string | null;
  couponCode?: string | null;
};

export function CartSummary({
  subtotal,
  freightLabel,
  total,
  discount,
  couponCode
}: CartSummaryProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function applyCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!code.trim()) {
      setError("Digite um cupom.");
      setMessage("");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    const response = await fetch("/api/cart/coupon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code })
    });
    const data = await response.json();

    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Nao consegui aplicar esse cupom.");
      return;
    }

    setCode("");
    setMessage(data.message ?? "Cupom aplicado.");
    router.refresh();
  }

  async function removeCoupon() {
    setLoading(true);
    setError("");
    setMessage("");

    const response = await fetch("/api/cart/coupon", {
      method: "DELETE"
    });
    const data = await response.json();

    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Nao consegui remover o cupom.");
      return;
    }

    setMessage("Cupom removido.");
    router.refresh();
  }

  return (
    <>
      <aside className="cart-summary-card panel sticky top-24 hidden h-fit gap-4 p-5 lg:grid">
        <p className="text-sm text-[var(--muted)]">Resumo</p>
        <div className="grid gap-2 text-sm">
          <p className="flex justify-between">
            <span>Subtotal</span>
            <strong>{subtotal}</strong>
          </p>
          {discount ? (
            <p className="flex justify-between text-[var(--accent)]">
              <span>Desconto{couponCode ? ` (${couponCode})` : ""}</span>
              <strong>- {discount}</strong>
            </p>
          ) : null}
          <p className="flex justify-between">
            <span>Frete</span>
            <strong>{freightLabel}</strong>
          </p>
        </div>
        <p className="text-3xl font-black text-[var(--accent)]">{total}</p>
        <div className="grid gap-2 text-sm text-[var(--muted)]">
          <span className="chip">estoque validado</span>
          <span className="chip">frete calculado no checkout</span>
          <span className="chip">pagamento seguro via PagBank</span>
          <span className="chip">pedido revisavel antes do pagamento</span>
        </div>
        <form className="grid gap-2" onSubmit={applyCoupon}>
          <label className="label">
            Tem cupom?
            <div className="flex gap-2">
              <input
                className="input"
                disabled={loading}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="BEMVINDO10"
                value={code}
              />
              <button className="btn secondary shrink-0 px-3" disabled={loading} type="submit">
                Aplicar
              </button>
            </div>
          </label>
          {couponCode ? (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-[var(--line)] bg-black/20 px-3 py-2 text-sm">
              <span>
                Cupom ativo: <strong>{couponCode}</strong>
              </span>
              <button className="btn secondary min-h-9 px-3" onClick={removeCoupon} type="button">
                Remover
              </button>
            </div>
          ) : null}
        </form>
        <StatusMessage message={error} variant="error" />
        {message ? <StatusMessage message={message} variant="success" /> : null}
        <Link className="btn shine cart-cta" href="/checkout">
          Fechar pedido com seguranca
        </Link>
      </aside>

      <div className="cart-sticky-bar surface fixed inset-x-3 bottom-3 z-40 grid gap-2 border border-[var(--line)] p-3 lg:hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-1">
            <p className="text-xs font-black uppercase text-[var(--accent-2)]">Subtotal {total}</p>
            <p className="text-xs text-[var(--muted)]">
              {discount ? `Cupom ${couponCode} aplicado • ` : ""}Frete calculado no checkout
            </p>
          </div>
          <Link className="btn shine min-h-11 px-4 text-sm" href="/checkout">
            Fechar pedido com seguranca
          </Link>
        </div>
        <form className="flex gap-2" onSubmit={applyCoupon}>
          <input
            className="input"
            disabled={loading}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder={couponCode ? `Cupom ${couponCode} ativo` : "Tem cupom? Digite aqui"}
            value={code}
          />
          {couponCode ? (
            <button className="btn secondary shrink-0 px-3" onClick={removeCoupon} type="button">
              Remover
            </button>
          ) : (
            <button className="btn secondary shrink-0 px-3" disabled={loading} type="submit">
              Aplicar
            </button>
          )}
        </form>
      </div>
    </>
  );
}
