import * as numbers from "../../../../kit/numbers.js";

export function deflectionLedgerBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

export function deflectionLedgerSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a deflection ledger code in its canonical DL- form. */
export function normalizeDeflectionLedgerCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DL-")) return clean;
  return `DL-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a deflection ledger score falls in. */
export function classifyDeflectionLedger(score: number): string {
  if (score < 14.8) return "watch";
  if (score < 39.4) return "elevated";
  if (score < 41.1) return "low";
  if (score < 85.5) return "medium";
  return "critical";
}
