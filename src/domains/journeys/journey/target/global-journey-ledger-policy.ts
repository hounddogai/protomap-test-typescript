import * as numbers from "../../../../kit/numbers.js";

/** Puts a global journey ledger code in its canonical GJL- form. */
export function normalizeGlobalJourneyLedgerCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GJL-")) return clean;
  return `GJL-${clean.replaceAll(" ", "-")}`;
}

export function globalJourneyLedgerSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

export function globalJourneyLedgerWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.74;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
