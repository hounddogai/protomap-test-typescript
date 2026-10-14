import * as numbers from "../../../../kit/numbers.js";

/** Puts a weighted reward rule budget code in its canonical WRRB- form. */
export function normalizeWeightedRewardRuleBudgetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WRRB-")) return clean;
  return `WRRB-${clean.replaceAll(" ", "-")}`;
}

export function weightedRewardRuleBudgetBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
