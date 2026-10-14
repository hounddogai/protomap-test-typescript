import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 47061.0, in order. */
export function lenientExitRuleAdjustmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 47061) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a lenient exit rule adjustment score falls in. */
export function classifyLenientExitRuleAdjustment(score: number): string {
  if (score < 34.5) return "minimal";
  if (score < 91.8) return "watch";
  return "critical";
}

export function lenientExitRuleAdjustmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
