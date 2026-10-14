import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 5685.0, in order. */
export function adaptiveReputationPlanBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 5685) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function adaptiveReputationPlanBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Names the band a adaptive reputation plan score falls in. */
export function classifyAdaptiveReputationPlan(score: number): string {
  if (score < 18.4) return "high";
  if (score < 19.3) return "watch";
  if (score < 40) return "ok";
  if (score < 52.4) return "minimal";
  return "elevated";
}
