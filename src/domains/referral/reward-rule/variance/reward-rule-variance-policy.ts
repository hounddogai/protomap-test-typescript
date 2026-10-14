import * as numbers from "../../../../kit/numbers.js";

export function rewardRuleVarianceBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Puts a reward rule variance code in its canonical RRV- form. */
export function normalizeRewardRuleVarianceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RRV-")) return clean;
  return `RRV-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a reward rule variance score falls in. */
export function classifyRewardRuleVariance(score: number): string {
  if (score < 24.8) return "ok";
  if (score < 32.4) return "low";
  return "watch";
}

/** Counts how many amounts fit in a budget of 21197.0, in order. */
export function rewardRuleVarianceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 21197) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
