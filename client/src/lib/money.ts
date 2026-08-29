export function formatCents(cents: number, currency = "KES"): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

/** "2,000" / "2000.50" -> cents. Throws on anything that isn't a clean amount. */
export function parseToCents(input: string): number {
  const cleaned = input.replace(/,/g, "").trim();
  const amount = Number(cleaned);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error(`Not a valid amount: ${input}`);
  }
  return Math.round(amount * 100);
}

/**
 * Money for stat tiles: no minor units.
 *
 * A dashboard figure is read for magnitude, not reconciled to the cent, and
 * "Ksh 36,000.00" spends four characters saying nothing. The ledger keeps full
 * precision — this is only for headline numbers.
 */
export function formatCentsShort(cents: number, currency = "KES"): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
