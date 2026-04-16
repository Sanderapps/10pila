"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type FieldErrors = Record<string, string>;

function required(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function validateCheckout(form: FormData) {
  const errors: FieldErrors = {};
  const fields = {
    recipient: "Informe quem vai receber.",
    phone: "Informe telefone com DDD.",
    zipCode: "Informe o CEP.",
    street: "Informe a rua.",
    number: "Informe o numero.",
    district: "Informe o bairro.",
    city: "Informe a cidade.",
    state: "Informe a UF."
  };

  for (const [field, message] of Object.entries(fields)) {
    if (!required(form.get(field))) {
      errors[field] = message;
    }
  }

  const phoneDigits = required(form.get("phone")).replace(/\D/g, "");
  const zipDigits = required(form.get("zipCode")).replace(/\D/g, "");
  const state = required(form.get("state")).toUpperCase();

  if (phoneDigits && phoneDigits.length < 10) {
    errors.phone = "Use DDD + telefone.";
  }

  if (zipDigits && zipDigits.length !== 8) {
    errors.zipCode = "CEP precisa ter 8 digitos.";
  }

  if (state && !/^[A-Z]{2}$/.test(state)) {
    errors.state = "UF precisa ter 2 letras, tipo SP.";
  }

  return errors;
}

function ErrorBox({ error, fieldErrors }: { error: string; fieldErrors: FieldErrors }) {
  if (!error && Object.keys(fieldErrors).length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-[var(--danger)] bg-black/40 p-3 text-sm text-[var(--danger)]">
      {error ? <p className="font-bold">{error}</p> : null}
      {Object.keys(fieldErrors).length > 0 ? (
        <ul className="mt-2 grid gap-1">
          {Object.entries(fieldErrors).map(([field, message]) => (
            <li key={field}>{message}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function CheckoutForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});
    setStatus("");

    const form = new FormData(event.currentTarget);
    const clientErrors = validateCheckout(form);

    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      setError("Revise os dados de entrega.");
      setLoading(false);
      return;
    }

    const payload = Object.fromEntries(form);
    payload.state = String(payload.state ?? "").toUpperCase();
    setStatus("Criando pedido e chamando o PagBank...");

    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setFieldErrors(data.fieldErrors ?? {});
      setError(data.error ?? "Nao deu para fechar o pedido agora.");
      setStatus("");
      return;
    }

    if (data.checkoutUrl) {
      setStatus("Pedido criado. Redirecionando para o PagBank...");
      window.location.href = data.checkoutUrl;
      return;
    }

    setStatus("Pedido criado em modo estrutural.");
    router.push(`/checkout?pedido=${data.orderId}`);
    router.refresh();
  }

  return (
    <form className="panel grid gap-4 p-5" noValidate onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="label">
          Nome para entrega
          <input className="input" name="recipient" placeholder="Nome de quem recebe" />
        </label>
        <label className="label">
          Telefone
          <input className="input" inputMode="tel" name="phone" placeholder="11999999999" />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="label">
          CEP
          <input className="input" inputMode="numeric" name="zipCode" placeholder="01001000" />
        </label>
        <label className="label md:col-span-2">
          Rua
          <input className="input" name="street" placeholder="Rua, avenida ou travessa" />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <label className="label">
          Numero
          <input className="input" name="number" placeholder="123" />
        </label>
        <label className="label">
          Complemento
          <input className="input" name="complement" placeholder="Apto, bloco, referencia" />
        </label>
        <label className="label">
          Bairro
          <input className="input" name="district" placeholder="Centro" />
        </label>
        <label className="label">
          UF
          <input className="input" maxLength={2} name="state" placeholder="SP" />
        </label>
      </div>
      <label className="label">
        Cidade
        <input className="input" name="city" placeholder="Sao Paulo" />
      </label>
      <ErrorBox error={error} fieldErrors={fieldErrors} />
      {status ? <p className="text-sm text-[var(--accent)]">{status}</p> : null}
      <button className="btn" disabled={loading} type="submit">
        {loading ? "Fechando pedido..." : "Fechar pedido"}
      </button>
    </form>
  );
}
