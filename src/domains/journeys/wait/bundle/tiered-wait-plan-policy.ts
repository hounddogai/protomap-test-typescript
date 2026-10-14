import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 60523.0, in order. */
export function tieredWaitPlanBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 60523) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a tiered wait plan score falls in. */
export function classifyTieredWaitPlan(score: number): string {
  if (score < 15.1) return "low";
  if (score < 34) return "elevated";
  return "ok";
}

export function tieredWaitPlanBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
