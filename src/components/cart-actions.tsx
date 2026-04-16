"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CartActions({
  itemId,
  quantity,
  maxQuantity
}: {
  itemId: string;
  quantity: number;
  maxQuantity: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function update(nextQuantity: number) {
    if (nextQuantity > maxQuantity) {
      setError(`Estoque disponivel: ${maxQuantity}.`);
      return;
    }

    setLoading(true);
    setError("");
    const response = await fetch("/api/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, quantity: nextQuantity })
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Nao deu para atualizar.");
      return;
    }

    router.refresh();
  }

  async function remove() {
    setLoading(true);
    await fetch("/api/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId })
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="btn secondary"
          disabled={loading || quantity <= 1}
          onClick={() => update(quantity - 1)}
        >
          -
        </button>
        <span className="min-w-8 text-center font-bold">{quantity}</span>
        <button
          className="btn secondary"
          disabled={loading || quantity >= maxQuantity}
          onClick={() => update(quantity + 1)}
        >
          +
        </button>
        <button className="btn danger" disabled={loading} onClick={remove}>
          Remover
        </button>
      </div>
      <p className="text-xs text-[var(--muted)]">Disponivel: {maxQuantity}</p>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
