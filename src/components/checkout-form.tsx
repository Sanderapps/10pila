"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function CheckoutForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);

    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form))
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Checkout falhou.");
      return;
    }

    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
      return;
    }

    router.push(`/checkout?pedido=${data.orderId}`);
    router.refresh();
  }

  return (
    <form className="panel grid gap-4 p-5" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="label">
          Nome para entrega
          <input className="input" name="recipient" required />
        </label>
        <label className="label">
          Telefone
          <input className="input" name="phone" required />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="label">
          CEP
          <input className="input" name="zipCode" required />
        </label>
        <label className="label md:col-span-2">
          Rua
          <input className="input" name="street" required />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <label className="label">
          Numero
          <input className="input" name="number" required />
        </label>
        <label className="label">
          Complemento
          <input className="input" name="complement" />
        </label>
        <label className="label">
          Bairro
          <input className="input" name="district" required />
        </label>
        <label className="label">
          UF
          <input className="input" name="state" required maxLength={2} />
        </label>
      </div>
      <label className="label">
        Cidade
        <input className="input" name="city" required />
      </label>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      <button className="btn" disabled={loading} type="submit">
        {loading ? "Gerando pedido..." : "Fechar pedido"}
      </button>
    </form>
  );
}
