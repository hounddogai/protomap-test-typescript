import * as numbers from "../../../../kit/numbers.js";

export function subscriptionLedgerWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.69;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function subscriptionLedgerBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Puts a subscription ledger code in its canonical SL- form. */
export function normalizeSubscriptionLedgerCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SL-")) return clean;
  return `SL-${clean.replaceAll(" ", "-")}`;
}

export function subscriptionLedgerSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}
