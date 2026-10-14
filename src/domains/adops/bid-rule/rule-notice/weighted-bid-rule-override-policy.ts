import * as numbers from "../../../../kit/numbers.js";

/** Puts a weighted bid rule override code in its canonical WBRO- form. */
export function normalizeWeightedBidRuleOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WBRO-")) return clean;
  return `WBRO-${clean.replaceAll(" ", "-")}`;
}

export function weightedBidRuleOverrideBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
