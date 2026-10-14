import * as numbers from "../../../../kit/numbers.js";

/** Puts a legacy exit rule ledger code in its canonical LERL- form. */
export function normalizeLegacyExitRuleLedgerCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LERL-")) return clean;
  return `LERL-${clean.replaceAll(" ", "-")}`;
}

export function legacyExitRuleLedgerWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.39;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function legacyExitRuleLedgerSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}
