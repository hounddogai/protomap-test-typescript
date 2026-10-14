import * as numbers from "../../../../kit/numbers.js";

export function weightedBadgeBudgetBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Puts a weighted badge budget code in its canonical WBB- form. */
export function normalizeWeightedBadgeBudgetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WBB-")) return clean;
  return `WBB-${clean.replaceAll(" ", "-")}`;
}
