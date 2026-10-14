import * as numbers from "../../../../kit/numbers.js";

export function adaptiveReputationSummaryBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Puts a adaptive reputation summary code in its canonical ARS- form. */
export function normalizeAdaptiveReputationSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ARS-")) return clean;
  return `ARS-${clean.replaceAll(" ", "-")}`;
}
