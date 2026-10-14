import * as numbers from "../../../../kit/numbers.js";

/** Names the band a global frequency ledger score falls in. */
export function classifyGlobalFrequencyLedger(score: number): string {
  if (score < 37.5) return "ok";
  if (score < 44.9) return "medium";
  if (score < 87.1) return "minimal";
  return "high";
}

/** Puts a global frequency ledger code in its canonical GFL- form. */
export function normalizeGlobalFrequencyLedgerCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GFL-")) return clean;
  return `GFL-${clean.replaceAll(" ", "-")}`;
}

export function globalFrequencyLedgerBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
