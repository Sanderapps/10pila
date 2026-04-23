"use client";

import type { Product } from "@prisma/client";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type AdminProduct = Product & {
  category?: string | null;
  specifications?: unknown;
};

function moneyInput(cents?: number | null) {
  return cents ? (cents / 100).toFixed(2) : "";
}

function specificationsText(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "";
  }

  return Object.entries(value as Record<string, unknown>)
    .map(([key, spec]) => `${key}: ${String(spec)}`)
    .join("\n");
}

function productPayload(form: FormData) {
  return {
    name: String(form.get("name") ?? ""),
    slug: String(form.get("slug") ?? ""),
    description: String(form.get("description") ?? ""),
    imageUrl: String(form.get("imageUrl") ?? ""),
    category: String(form.get("category") ?? ""),
    specifications: String(form.get("specifications") ?? ""),
    price: String(form.get("price") ?? ""),
    promotionalPrice: String(form.get("promotionalPrice") ?? ""),
    stock: String(form.get("stock") ?? ""),
    active: form.get("active") === "on",
    featured: form.get("featured") === "on"
  };
}

function Feedback({ error, success }: { error: string; success: string }) {
  if (!error && !success) {
    return null;
  }

  return (
    <p className={error ? "text-sm text-[var(--danger)]" : "text-sm text-[var(--accent)]"}>
      {error || success}
    </p>
  );
}

export function ProductForm({ product }: { product?: AdminProduct }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(product);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    const form = new FormData(event.currentTarget);
    const payload = productPayload(form);

    const response = await fetch(isEdit ? `/api/admin/products/${product?.id}` : "/api/admin/products", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Falha ao salvar produto.");
      return;
    }

    if (!isEdit) {
      event.currentTarget.reset();
    }

    setSuccess(isEdit ? "Produto atualizado." : "Produto cadastrado.");
    router.refresh();
  }

  return (
    <form className="panel grid gap-4 p-5" onSubmit={onSubmit}>
      <h2 className="text-2xl font-bold">{isEdit ? "Editar produto" : "Novo produto"}</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="label">
          Nome
          <input className="input" defaultValue={product?.name} name="name" required />
        </label>
        <label className="label">
          Slug
          <input className="input" defaultValue={product?.slug} name="slug" placeholder="gerado pelo nome" />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="label">
          Categoria
          <input className="input" defaultValue={product?.category ?? ""} name="category" placeholder="Audio, Setup, Energia..." />
        </label>
        <label className="label">
          URL da imagem
          <input
            className="input"
            defaultValue={product?.imageUrl}
            name="imageUrl"
            placeholder="/catalog/products/seu-slug.webp"
            required
          />
        </label>
      </div>
      <label className="label">
        Descricao
        <textarea className="input min-h-24" defaultValue={product?.description} name="description" required />
      </label>
      <label className="label">
        Especificacoes tecnicas
        <textarea
          className="input min-h-24"
          defaultValue={specificationsText(product?.specifications)}
          name="specifications"
          placeholder={"Resolucao: 720p\nConexao: Bluetooth\nBateria: 10h"}
        />
      </label>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="label">
          Preco
          <input className="input" defaultValue={moneyInput(product?.priceCents)} name="price" placeholder="199.90" required />
        </label>
        <label className="label">
          Preco promo
          <input className="input" defaultValue={moneyInput(product?.promotionalCents)} name="promotionalPrice" placeholder="149.90" />
        </label>
        {!isEdit ? (
          <label className="label">
            Estoque inicial
            <input className="input" defaultValue="0" name="stock" type="number" min="0" required />
          </label>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-4 text-sm text-[var(--muted)]">
        <label className="flex items-center gap-2">
          <input name="active" type="checkbox" defaultChecked={product?.active ?? true} /> Ativo
        </label>
        <label className="flex items-center gap-2">
          <input name="featured" type="checkbox" defaultChecked={product?.featured ?? false} /> Destaque
        </label>
      </div>
      <Feedback error={error} success={success} />
      <button className="btn w-fit" disabled={loading} type="submit">
        {loading ? "Salvando..." : isEdit ? "Salvar produto" : "Cadastrar produto"}
      </button>
    </form>
  );
}

export function StockAdjustForm({ product }: { product: Product }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
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
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Falha no ajuste.");
      return;
    }

    event.currentTarget.reset();
    setSuccess("Estoque atualizado.");
    router.refresh();
  }

  return (
    <form className="grid gap-2" onSubmit={onSubmit}>
      <div className="flex gap-2">
        <input className="input" name="quantity" placeholder="+5 ou -2" type="number" required />
        <button className="btn secondary" disabled={loading} type="submit">
          {loading ? "..." : "Ajustar"}
        </button>
      </div>
      <input className="input" name="note" placeholder="Motivo do ajuste" />
      <Feedback error={error} success={success} />
    </form>
  );
}

export function ProductDeleteButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    setLoading(true);
    setMessage("");
    const response = await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
    const data = await response.json();
    setLoading(false);
    setMessage(data.message ?? (response.ok ? "Produto removido." : data.error ?? "Falha ao remover."));
    router.refresh();
  }

  return (
    <div className="grid gap-2">
      <button className="btn danger" disabled={loading} onClick={onDelete} type="button">
        {loading ? "Removendo..." : "Excluir/inativar"}
      </button>
      {message ? <p className="text-xs text-[var(--muted)]">{message}</p> : null}
    </div>
  );
}

export function OrderStatusForm({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const statuses = [
    { value: "PENDING", label: "Pendente" },
    { value: "AWAITING_PAYMENT", label: "Aguardando pagamento" },
    { value: "PAID", label: "Pago" },
    { value: "PROCESSING", label: "Processando" },
    { value: "SHIPPED", label: "Enviado" },
    { value: "DELIVERED", label: "Entregue" },
    { value: "CANCELED", label: "Cancelado" }
  ];

  async function onChange(nextStatus: string) {
    setLoading(true);
    setError("");
    const response = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status: nextStatus })
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Falha ao atualizar status.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="grid gap-2">
      <select className="input" defaultValue={status} disabled={loading} onChange={(event) => onChange(event.target.value)}>
        {statuses.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <p className="text-xs text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
