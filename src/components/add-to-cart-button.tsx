"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { StatusMessage } from "@/components/status-message";

export function AddToCartButton({
  productId,
  maxQuantity
}: {
  productId: string;
  maxQuantity: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [showFeedback, setShowFeedback] = useState(false);

  function setSafeQuantity(nextQuantity: number) {
    setQuantity(Math.min(Math.max(nextQuantity, 1), maxQuantity));
  }

  async function addToCart() {
    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");
    setShowFeedback(false);

    const response = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity })
    });

    if (response.status === 401) {
      const currentPath = `${window.location.pathname}${window.location.search}`;
      setLoading(false);
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(currentPath)}`);
      return;
    }

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setErrorMessage(data.error ?? "Nao deu para adicionar.");
      return;
    }

    setSuccessMessage(`${quantity} item(ns) no carrinho. Achadinho guardado com sucesso.`);
    setShowFeedback(true);
    router.refresh();
  }

  function closeFeedback() {
    setShowFeedback(false);
    setErrorMessage("");
  }

  return (
    <div className="grid gap-2">
      <div className="surface flex w-fit items-center gap-2 p-2">
        <button
          className="btn secondary min-h-10 min-w-10 px-3"
          disabled={loading || quantity <= 1}
          onClick={() => setSafeQuantity(quantity - 1)}
          type="button"
        >
          -
        </button>
        <input
          aria-label="Quantidade"
          className="input w-20 text-center"
          max={maxQuantity}
          min={1}
          onChange={(event) => setSafeQuantity(Number(event.target.value) || 1)}
          type="number"
          value={quantity}
        />
        <button
          className="btn secondary min-h-10 min-w-10 px-3"
          disabled={loading || quantity >= maxQuantity}
          onClick={() => setSafeQuantity(quantity + 1)}
          type="button"
        >
          +
        </button>
      </div>
      <button className="btn min-h-11" disabled={loading} onClick={addToCart}>
        {loading ? "Guardando no carrinho..." : "Adicionar ao carrinho"}
      </button>
      {errorMessage ? (
        <StatusMessage message={errorMessage} title="Nao deu para adicionar" variant="error" />
      ) : null}
      {showFeedback ? (
        <div className="surface fixed bottom-4 right-4 z-50 grid w-[min(420px,calc(100vw-32px))] gap-3 border border-[var(--line-strong)] p-4 shadow-2xl">
          <p className="text-xs font-black uppercase tracking-normal text-[var(--accent)]">add to cart</p>
          <p className="font-bold">Produto adicionado. Carrinho ganhou mais um achado.</p>
          <p className="text-sm text-[var(--muted)]">{successMessage}</p>
          <div className="flex flex-wrap gap-2">
            <a className="btn" href="/carrinho">
              Ir para o carrinho
            </a>
            <button className="btn secondary" onClick={closeFeedback} type="button">
              Continuar comprando
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
