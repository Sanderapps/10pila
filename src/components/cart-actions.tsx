"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CartActions({
  itemId,
  quantity
}: {
  itemId: string;
  quantity: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function update(nextQuantity: number) {
    setLoading(true);
    await fetch("/api/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, quantity: nextQuantity })
    });
    setLoading(false);
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
    <div className="flex flex-wrap items-center gap-2">
      <button
        className="btn secondary"
        disabled={loading || quantity <= 1}
        onClick={() => update(quantity - 1)}
      >
        -
      </button>
      <span className="min-w-8 text-center font-bold">{quantity}</span>
      <button className="btn secondary" disabled={loading} onClick={() => update(quantity + 1)}>
        +
      </button>
      <button className="btn danger" disabled={loading} onClick={remove}>
        Remover
      </button>
    </div>
  );
}
