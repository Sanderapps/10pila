"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { StatusMessage } from "@/components/status-message";

type FieldErrors = Record<string, string>;

type CheckoutAddress = {
  id: string;
  isDefault: boolean;
  recipient: string;
  phone: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
};

type CheckoutItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
};

type CheckoutFormProps = {
  initialAddresses: CheckoutAddress[];
  items: CheckoutItem[];
  couponCode?: string | null;
  productDiscount?: string | null;
  freightDiscount?: string | null;
  subtotal: string;
  freight: string;
  total: string;
};

type AddressFormValues = Omit<CheckoutAddress, "id" | "isDefault">;

const emptyAddress: AddressFormValues = {
  recipient: "",
  phone: "",
  zipCode: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: ""
};

function validateCheckout(values: AddressFormValues) {
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
    if (!String(values[field as keyof AddressFormValues] ?? "").trim()) {
      errors[field] = message;
    }
  }

  const phoneDigits = values.phone.replace(/\D/g, "");
  const zipDigits = values.zipCode.replace(/\D/g, "");
  const state = values.state.toUpperCase();

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

function summariseAddress(address: CheckoutAddress | AddressFormValues) {
  return `${address.street}, ${address.number}${address.complement ? `, ${address.complement}` : ""} • ${address.district} • ${address.city}/${address.state} • CEP ${address.zipCode}`;
}

function normaliseValues(values: AddressFormValues): AddressFormValues {
  return {
    recipient: values.recipient.trim(),
    phone: values.phone.trim(),
    zipCode: values.zipCode.trim(),
    street: values.street.trim(),
    number: values.number.trim(),
    complement: values.complement.trim(),
    district: values.district.trim(),
    city: values.city.trim(),
    state: values.state.trim().toUpperCase()
  };
}

function valuesFromAddress(address: CheckoutAddress): AddressFormValues {
  return {
    recipient: address.recipient,
    phone: address.phone,
    zipCode: address.zipCode,
    street: address.street,
    number: address.number,
    complement: address.complement,
    district: address.district,
    city: address.city,
    state: address.state
  };
}

export function CheckoutForm({
  initialAddresses,
  items,
  couponCode,
  productDiscount,
  freightDiscount,
  subtotal,
  freight,
  total
}: CheckoutFormProps) {
  const router = useRouter();
  const defaultAddress = useMemo(
    () => initialAddresses.find((address) => address.isDefault) ?? initialAddresses[0] ?? null,
    [initialAddresses]
  );
  const [savedAddresses] = useState(initialAddresses);
  const [selectedAddressId, setSelectedAddressId] = useState(defaultAddress?.id ?? "");
  const [editing, setEditing] = useState(initialAddresses.length === 0);
  const [reviewing, setReviewing] = useState(false);
  const [saveAsDefault, setSaveAsDefault] = useState(defaultAddress?.isDefault ?? true);
  const [values, setValues] = useState<AddressFormValues>(
    defaultAddress ? valuesFromAddress(defaultAddress) : emptyAddress
  );
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [zipStatus, setZipStatus] = useState("");
  const totalUnits = useMemo(
    () => items.reduce((count, item) => count + item.quantity, 0),
    [items]
  );

  const selectedAddress =
    savedAddresses.find((address) => address.id === selectedAddressId) ?? defaultAddress;

  function updateValue(field: keyof AddressFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function openReview() {
    const payloadValues = normaliseValues(values);
    const clientErrors = validateCheckout(payloadValues);

    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      setError("Revise os dados de entrega.");
      return;
    }

    setValues(payloadValues);
    setError("");
    setFieldErrors({});
    setStatus("Endereco confirmado. Agora so falta revisar o pedido e seguir para o pagamento seguro.");
    setReviewing(true);
  }

  async function fillAddressFromCep(zipCode: string) {
    const digits = zipCode.replace(/\D/g, "");

    if (digits.length !== 8) {
      return;
    }

    setZipStatus("Consultando CEP...");

    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await response.json();

      if (!response.ok || data.erro) {
        setZipStatus("Nao achei esse CEP. Pode seguir preenchendo manualmente.");
        return;
      }

      setValues((current) => ({
        ...current,
        street: current.street || data.logradouro || "",
        district: current.district || data.bairro || "",
        city: current.city || data.localidade || "",
        state: current.state || data.uf || "",
        complement: current.complement || data.complemento || ""
      }));
      setZipStatus("CEP encontrado. Complete numero e revise os dados.");
    } catch {
      setZipStatus("Nao deu para consultar o CEP agora. Pode preencher manualmente.");
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!reviewing) {
      openReview();
      return;
    }

    setLoading(true);
    setError("");
    setFieldErrors({});
    setStatus("");

    const payloadValues = normaliseValues(values);
    const clientErrors = validateCheckout(payloadValues);

    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      setError("Revise os dados de entrega.");
      setLoading(false);
      setReviewing(false);
      return;
    }

    setStatus("Conferindo estoque, endereco e preparando o redirecionamento seguro...");

    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payloadValues,
        addressId: editing ? selectedAddressId || undefined : selectedAddress?.id,
        saveAsDefault
      })
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
      setStatus("Pedido revisado. Indo para o ambiente seguro do PagBank...");
      window.location.href = data.checkoutUrl;
      return;
    }

    setStatus(
      data.checkoutMessage ??
        "Pedido salvo na 10PILA. O link de pagamento ainda nao voltou, mas seu pedido ficou registrado."
    );
    router.push(`/checkout?pedido=${data.orderId}`);
    router.refresh();
  }

  return (
    <form className="panel grid gap-4 p-5" noValidate onSubmit={onSubmit}>
      <section className="grid gap-3 rounded-lg border border-[var(--line)] bg-black/20 p-4">
        <div className="grid gap-1">
          <p className="text-sm font-bold text-[var(--accent)]">Etapa final</p>
          <h2 className="text-2xl font-black">Revise o pedido antes do pagamento</h2>
          <p className="text-sm text-[var(--muted)]">
            O fechamento continua na 10PILA ate o momento do pagamento. Depois disso, voce segue para o ambiente
            seguro do PagBank e volta para acompanhar tudo por aqui.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
          <span className="chip">estoque validado antes do fechamento</span>
          <span className="chip">endereco revisavel</span>
          <span className="chip">pedido vinculado a esta conta</span>
          <span className="chip">retorno para acompanhamento no 10PILA</span>
        </div>
      </section>

      {savedAddresses.length > 0 ? (
        <section className="grid gap-3 rounded-lg border border-[var(--line)] bg-black/20 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[var(--accent)]">Entrega</p>
              <p className="text-sm text-[var(--muted)]">
                Use o endereco salvo ou ajuste antes de fechar.
              </p>
            </div>
            {selectedAddress?.isDefault ? (
              <span className="rounded-full border border-[var(--line)] px-2 py-1 text-xs text-[var(--accent-2)]">
                Padrao
              </span>
            ) : null}
          </div>

          {savedAddresses.length > 1 ? (
            <label className="label">
              Enderecos salvos
              <select
                className="input"
                disabled={loading}
                onChange={(event) => {
                  const nextAddress =
                    savedAddresses.find((address) => address.id === event.target.value) ?? null;
                  setSelectedAddressId(event.target.value);
                  if (nextAddress) {
                    setValues(valuesFromAddress(nextAddress));
                    setSaveAsDefault(nextAddress.isDefault);
                  }
                  setEditing(false);
                  setReviewing(false);
                }}
                value={selectedAddressId}
              >
                {savedAddresses.map((address) => (
                  <option key={address.id} value={address.id}>
                    {address.street}, {address.number} • {address.city}/{address.state}
                    {address.isDefault ? " (padrao)" : ""}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {selectedAddress && !editing ? (
            <div className="grid gap-2 rounded-lg border border-[var(--line)] bg-[rgba(9,12,16,0.75)] p-4">
              <p className="font-bold">{selectedAddress.recipient}</p>
              <p className="text-sm text-[var(--muted)]">{selectedAddress.phone}</p>
              <p className="text-sm text-[var(--muted)]">{summariseAddress(selectedAddress)}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  className="btn min-h-9 px-3"
                  disabled={loading}
                  onClick={openReview}
                  type="button"
                >
                  Revisar pedido
                </button>
                <button
                  className="btn secondary min-h-9 px-3"
                  disabled={loading}
                  onClick={() => {
                    if (selectedAddress) {
                      setValues(valuesFromAddress(selectedAddress));
                      setSaveAsDefault(selectedAddress.isDefault);
                    }
                    setEditing(true);
                    setReviewing(false);
                  }}
                  type="button"
                >
                  Alterar
                </button>
                <button
                  className="btn secondary min-h-9 px-3"
                  disabled={loading}
                  onClick={() => {
                    setSelectedAddressId("");
                    setValues(emptyAddress);
                    setSaveAsDefault(savedAddresses.length === 0);
                    setEditing(true);
                    setReviewing(false);
                  }}
                  type="button"
                >
                  Novo endereco
                </button>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {editing ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="label">
              Nome para entrega
              <input
                autoComplete="name"
                className="input"
                name="recipient"
                onChange={(event) => updateValue("recipient", event.target.value)}
                placeholder="Nome de quem recebe"
                value={values.recipient}
              />
            </label>
            <label className="label">
              Telefone
              <input
                autoComplete="tel"
                className="input"
                inputMode="tel"
                name="phone"
                onChange={(event) => updateValue("phone", event.target.value)}
                placeholder="11999999999"
                value={values.phone}
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="label">
              CEP
              <input
                autoComplete="postal-code"
                className="input"
                inputMode="numeric"
                name="zipCode"
                onBlur={() => void fillAddressFromCep(values.zipCode)}
                onChange={(event) => updateValue("zipCode", event.target.value)}
                placeholder="01001000"
                value={values.zipCode}
              />
            </label>
            <label className="label md:col-span-2">
              Rua
              <input
                autoComplete="address-line1"
                className="input"
                name="street"
                onChange={(event) => updateValue("street", event.target.value)}
                placeholder="Rua, avenida ou travessa"
                value={values.street}
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <label className="label">
              Numero
              <input
                autoComplete="address-line2"
                className="input"
                inputMode="numeric"
                name="number"
                onChange={(event) => updateValue("number", event.target.value)}
                placeholder="123"
                value={values.number}
              />
            </label>
            <label className="label">
              Complemento
              <input
                autoComplete="address-line2"
                className="input"
                name="complement"
                onChange={(event) => updateValue("complement", event.target.value)}
                placeholder="Apto, bloco, referencia"
                value={values.complement}
              />
            </label>
            <label className="label">
              Bairro
              <input
                autoComplete="address-level2"
                className="input"
                name="district"
                onChange={(event) => updateValue("district", event.target.value)}
                placeholder="Centro"
                value={values.district}
              />
            </label>
            <label className="label">
              UF
              <input
                autoComplete="address-level1"
                className="input"
                maxLength={2}
                name="state"
                onChange={(event) => updateValue("state", event.target.value)}
                placeholder="SP"
                value={values.state}
              />
            </label>
          </div>
          <label className="label">
            Cidade
            <input
              autoComplete="address-level2"
              className="input"
              name="city"
              onChange={(event) => updateValue("city", event.target.value)}
              placeholder="Sao Paulo"
              value={values.city}
            />
          </label>
          <label className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-black/20 px-3 py-3 text-sm">
            <input
              checked={saveAsDefault}
              className="size-4 accent-[var(--accent-2)]"
              onChange={(event) => setSaveAsDefault(event.target.checked)}
              type="checkbox"
            />
            <span>Salvar como endereco padrao da conta</span>
          </label>
          {zipStatus ? <p className="text-sm text-[var(--accent-2)]">{zipStatus}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button className="btn" disabled={loading} onClick={openReview} type="button">
              Continuar para revisao
            </button>
            {savedAddresses.length > 0 ? (
              <button
                className="btn secondary"
                disabled={loading}
                onClick={() => {
                  if (selectedAddress) {
                    setValues(valuesFromAddress(selectedAddress));
                    setSaveAsDefault(selectedAddress.isDefault);
                  }
                  setEditing(false);
                  setError("");
                  setFieldErrors({});
                  setStatus("");
                  setReviewing(false);
                }}
                type="button"
              >
                Cancelar edicao
              </button>
            ) : null}
          </div>
        </>
      ) : null}

      {reviewing ? (
        <section className="checkout-review-shell grid gap-4 rounded-lg border border-[var(--line)] bg-[rgba(9,12,16,0.72)] p-4">
          <div className="checkout-review-backdrop" />
          <div className="grid gap-1">
            <p className="text-sm font-bold text-[var(--accent)]">Revisao final</p>
            <h3 className="text-xl font-black">Tudo certo antes do pagamento seguro</h3>
            <p className="text-sm text-[var(--muted)]">
              Aqui voce confere itens, entrega e total. O pagamento e concluido no ambiente seguro do PagBank, mas
              o pedido continua amarrado ao seu historico na 10PILA.
            </p>
          </div>

          <div className="grid gap-2 md:grid-cols-3">
            <div className="checkout-step chip bg-black/40 text-[var(--accent)]">1. carrinho fechado</div>
            <div className="checkout-step chip border-[var(--accent-2)] bg-black/40 text-[var(--accent-2)]">
              2. endereco revisado
            </div>
            <div className="checkout-step chip bg-black/40">3. pagamento seguro no PagBank</div>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_280px]">
            <div className="grid gap-3">
              <div className="rounded-lg border border-[var(--line)] bg-black/20 p-4">
                <p className="mb-2 text-sm font-bold">Entrega</p>
                <p className="font-bold">{values.recipient}</p>
                <p className="text-sm text-[var(--muted)]">{values.phone}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{summariseAddress(values)}</p>
                <p className="mt-3 text-xs text-[var(--muted)]">
                  Se algo estiver torto, volta um passo e ajusta antes de seguir.
                </p>
              </div>

              <div className="rounded-lg border border-[var(--line)] bg-black/20 p-4">
                <p className="mb-2 text-sm font-bold">Itens do pedido</p>
                <div className="grid gap-2 text-sm">
                  {items.map((item) => (
                    <div className="flex items-start justify-between gap-3" key={item.id}>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-[var(--muted)]">
                          {item.quantity}x {item.unitPrice}
                        </p>
                      </div>
                      <strong>{item.totalPrice}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="rounded-lg border border-[var(--line)] bg-black/25 p-4">
              <p className="text-sm font-bold">Resumo visual</p>
              <div className="mt-3 grid gap-2 text-sm">
                <p className="flex justify-between text-[var(--muted)]">
                  <span>Itens</span>
                  <strong className="text-[var(--foreground)]">
                    {items.length} produto(s) / {totalUnits} unidade(s)
                  </strong>
                </p>
                <p className="flex justify-between">
                  <span>Subtotal</span>
                  <strong>{subtotal}</strong>
                </p>
                {productDiscount ? (
                  <p className="flex justify-between text-[var(--accent)]">
                    <span>Desconto nos produtos{couponCode ? ` (${couponCode})` : ""}</span>
                    <strong>- {productDiscount}</strong>
                  </p>
                ) : null}
                {freightDiscount ? (
                  <p className="flex justify-between text-[var(--accent-2)]">
                    <span>Desconto no frete{couponCode ? ` (${couponCode})` : ""}</span>
                    <strong>- {freightDiscount}</strong>
                  </p>
                ) : null}
                <p className="flex justify-between">
                  <span>Frete</span>
                  <strong>{freight}</strong>
                </p>
                <p className="mt-1 flex justify-between border-t border-[var(--line)] pt-3 text-base font-black text-[var(--accent)]">
                  <span>Total final</span>
                  <span>{total}</span>
                </p>
              </div>
              <div className="mt-4 grid gap-2">
                <span className="chip w-fit border-[var(--accent)] bg-black/50 text-[var(--accent)]">
                  pagamento seguro
                </span>
                <span className="chip w-fit bg-black/50">checkout hospedado</span>
                <span className="chip w-fit bg-black/50">pedido volta para sua conta</span>
              </div>
              <div className="mt-4 rounded-lg border border-[var(--line)] bg-[rgba(10,15,20,0.85)] p-3 text-sm text-[var(--muted)]">
                Voce sera redirecionado para o PagBank para concluir o pagamento em ambiente seguro. Depois, o
                acompanhamento do pedido continua aqui na 10PILA.
              </div>
            </aside>
          </div>

          <div className="grid gap-3">
            <p className="text-sm text-[var(--muted)]">
              Proximo passo: abrir o ambiente seguro do PagBank para concluir o pagamento sem perder o rastro do pedido.
            </p>
            <div className="flex flex-wrap gap-3">
            <button
              className="btn secondary"
              disabled={loading}
              onClick={() => setReviewing(false)}
              type="button"
            >
              Voltar e revisar
            </button>
            <button className="btn shine" disabled={loading} type="submit">
              {loading ? "Preparando..." : "Ir para pagamento seguro"}
            </button>
            </div>
          </div>
        </section>
      ) : null}

      <StatusMessage
        fieldErrors={fieldErrors}
        message={error}
        title={error ? "Checkout precisa de ajuste" : undefined}
        variant="error"
      />
      {status ? <StatusMessage message={status} variant="success" /> : null}
    </form>
  );
}
