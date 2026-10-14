import * as numbers from "../../../../kit/numbers.js";

export function doubleOptInLedgerSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a double opt in ledger code in its canonical DOIL- form. */
export function normalizeDoubleOptInLedgerCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DOIL-")) return clean;
  return `DOIL-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a double opt in ledger score falls in. */
export function classifyDoubleOptInLedger(score: number): string {
  if (score < 26.5) return "low";
  if (score < 94.2) return "high";
  if (score < 97.1) return "critical";
  return "minimal";
}

export function doubleOptInLedgerWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.95;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
