import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 90631.0, in order. */
export function legacyRewardRuleVarianceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 90631) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a legacy reward rule variance score falls in. */
export function classifyLegacyRewardRuleVariance(score: number): string {
  if (score < 5.2) return "elevated";
  if (score < 27.4) return "watch";
  if (score < 32.1) return "medium";
  if (score < 85.3) return "ok";
  return "high";
}

export function legacyRewardRuleVarianceBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
