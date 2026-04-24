const DEFAULT_FIRST_WEEK_START_AT = "2026-04-24T00:00:00.000Z";
const DEFAULT_FIRST_WEEK_DURATION_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type FreightOfferResolution = {
  campaignLabel: string | null;
  campaignMessage: string | null;
  campaignShortLabel: string | null;
  freightDiscountCents: number;
  effectiveFreightCents: number;
  isActive: boolean;
  startsAt: Date;
  endsAt: Date;
};

function parseStartAt(value: string | undefined) {
  const parsed = new Date(value ?? DEFAULT_FIRST_WEEK_START_AT);
  return Number.isNaN(parsed.getTime()) ? new Date(DEFAULT_FIRST_WEEK_START_AT) : parsed;
}

function parseDurationDays(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_FIRST_WEEK_DURATION_DAYS;
}

export function resolveFreightOffer(baseFreightCents: number, now = new Date()): FreightOfferResolution {
  const startsAt = parseStartAt(process.env.FREIGHT_FREE_FIRST_WEEK_START_AT);
  const durationDays = parseDurationDays(process.env.FREIGHT_FREE_FIRST_WEEK_DURATION_DAYS);
  const endsAt = new Date(startsAt.getTime() + durationDays * MS_PER_DAY);
  const isActive = now >= startsAt && now < endsAt && baseFreightCents > 0;
  const freightDiscountCents = isActive ? baseFreightCents : 0;

  return {
    campaignLabel: isActive ? "frete gratis na primeira semana" : null,
    campaignMessage: isActive
      ? "Frete gratis automatico em todo o catalogo na primeira semana. Entra direto no total, sem cupom."
      : null,
    campaignShortLabel: isActive ? "frete gratis sem cupom" : null,
    freightDiscountCents,
    effectiveFreightCents: Math.max(baseFreightCents - freightDiscountCents, 0),
    isActive,
    startsAt,
    endsAt
  };
}
