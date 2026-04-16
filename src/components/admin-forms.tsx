"use client";

import type { Product } from "@prisma/client";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function ProductCreateForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);

    const response = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(form.get("name")),
        description: String(form.get("description")),
        imageUrl: String(form.get("imageUrl")),
        price: String(form.get("price")),
        promotionalPrice: String(form.get("promotionalPrice") ?? ""),
        stock: String(form.get("stock")),
        active: form.get("active") === "on",
        featured: form.get("featured") === "on"
      })
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Falha ao criar produto.");
      return;
    }

    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <form className="panel grid gap-4 p-5" onSubmit={onSubmit}>
      <h2 className="text-2xl font-bold">Novo produto</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="label">
          Nome
          <input className="input" name="name" required />
        </label>
        <label className="label">
          URL da imagem
          <input className="input" name="imageUrl" type="url" required />
        </label>
      </div>
      <label className="label">
        Descricao
        <textarea className="input min-h-24" name="description" required />
      </label>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="label">
          Preco
          <input className="input" name="price" placeholder="199.90" required />
        </label>
        <label className="label">
          Preco promo
          <input className="input" name="promotionalPrice" placeholder="149.90" />
        </label>
        <label className="label">
          Estoque inicial
          <input className="input" name="stock" type="number" min="0" required />
        </label>
      </div>
      <div className="flex flex-wrap gap-4 text-sm text-[var(--muted)]">
        <label className="flex items-center gap-2">
          <input name="active" type="checkbox" defaultChecked /> Ativo
        </label>
        <label className="flex items-center gap-2">
          <input name="featured" type="checkbox" /> Destaque
        </label>
      </div>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      <button className="btn w-fit" disabled={loading} type="submit">
        {loading ? "Salvando..." : "Cadastrar produto"}
      </button>
    </form>
  );
}

export function StockAdjustForm({ product }: { product: Product }) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: product.id,
        quantity: Number(form.get("quantity")),
        note: String(form.get("note") ?? "")
      })
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Falha no ajuste.");
      return;
    }

    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <form className="grid gap-2" onSubmit={onSubmit}>
      <div className="flex gap-2">
        <input className="input" name="quantity" placeholder="+5 ou -2" type="number" required />
        <button className="btn secondary" type="submit">
          Ajustar
        </button>
      </div>
      <input className="input" name="note" placeholder="Motivo do ajuste" />
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
    </form>
  );
}

export function OrderStatusForm({
  orderId,
  status
}: {
  orderId: string;
  status: string;
}) {
  const router = useRouter();
  const statuses = [
    "PENDING",
    "AWAITING_PAYMENT",
    "PAID",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELED"
  ];

  async function onChange(nextStatus: string) {
    await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status: nextStatus })
    });
    router.refresh();
  }

  return (
    <select className="input" defaultValue={status} onChange={(event) => onChange(event.target.value)}>
      {statuses.map((value) => (
        <option key={value} value={value}>
          {value}
        </option>
      ))}
    </select>
  );
}
