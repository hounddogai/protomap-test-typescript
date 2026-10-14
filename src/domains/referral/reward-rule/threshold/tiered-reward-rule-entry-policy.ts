import * as numbers from "../../../../kit/numbers.js";

/** Puts a tiered reward rule entry code in its canonical TRRE- form. */
export function normalizeTieredRewardRuleEntryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TRRE-")) return clean;
  return `TRRE-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a tiered reward rule entry score falls in. */
export function classifyTieredRewardRuleEntry(score: number): string {
  if (score < 43.2) return "elevated";
  if (score < 72) return "high";
  return "ok";
}

export function tieredRewardRuleEntryBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
