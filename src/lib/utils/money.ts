export function centsToBRL(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(cents / 100);
}

export function decimalStringToCents(value: string | number | undefined) {
  if (value === undefined) {
    return 0;
  }

  const normalized = String(value).replace(",", ".");
  const parsed = Number.parseFloat(normalized);

  if (Number.isNaN(parsed)) {
    return 0;
  }

  return Math.round(parsed * 100);
}

export function freightCents() {
  return decimalStringToCents(process.env.FREIGHT_FIXED_PRICE ?? "19.90");
}
