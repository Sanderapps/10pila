"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AddToCartButton({
  productId,
  maxQuantity
}: {
  productId: string;
  maxQuantity: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [showFeedback, setShowFeedback] = useState(false);

  function setSafeQuantity(nextQuantity: number) {
    setQuantity(Math.min(Math.max(nextQuantity, 1), maxQuantity));
  }

  async function addToCart() {
    setLoading(true);
    setMessage("");
    setShowFeedback(false);

    const response = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity })
    });

    if (response.status === 401) {
      router.push("/auth/login");
      return;
    }

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error ?? "Nao deu para adicionar.");
      return;
    }

    setMessage(`${quantity} item(ns) no carrinho. Setup evoluindo.`);
    setShowFeedback(true);
    router.refresh();
  }

  return (
    <div className="grid gap-2">
      <div className="flex w-fit items-center gap-2 rounded-lg border border-[var(--line)] p-2">
        <button
          className="btn secondary"
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
          className="btn secondary"
          disabled={loading || quantity >= maxQuantity}
          onClick={() => setSafeQuantity(quantity + 1)}
          type="button"
        >
          +
        </button>
      </div>
      <button className="btn" disabled={loading} onClick={addToCart}>
        {loading ? "Adicionando..." : "Adicionar ao carrinho"}
      </button>
      {message ? <p className="text-sm text-[var(--muted)]">{message}</p> : null}
      {showFeedback ? (
        <div className="fixed right-4 bottom-4 z-50 grid w-[min(420px,calc(100vw-32px))] gap-3 rounded-lg border border-[var(--line)] bg-black p-4">
          <p className="font-bold">Produto adicionado. Carrinho ganhou buff.</p>
          <div className="flex flex-wrap gap-2">
            <a className="btn" href="/carrinho">
              Ir para o carrinho
            </a>
            <button className="btn secondary" onClick={() => setShowFeedback(false)} type="button">
              Continuar comprando
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
