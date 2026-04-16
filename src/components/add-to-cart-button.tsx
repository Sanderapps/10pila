"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AddToCartButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function addToCart() {
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: 1 })
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

    setMessage("Foi pro carrinho. Setup evoluindo.");
    router.refresh();
  }

  return (
    <div className="grid gap-2">
      <button className="btn" disabled={loading} onClick={addToCart}>
        {loading ? "Adicionando..." : "Adicionar ao carrinho"}
      </button>
      {message ? <p className="text-sm text-[var(--muted)]">{message}</p> : null}
    </div>
  );
}
