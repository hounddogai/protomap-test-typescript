import * as numbers from "../../../../kit/numbers.js";

/** Names the band a cohort slot score falls in. */
export function classifyCohortSlot(score: number): string {
  if (score < 17.4) return "medium";
  if (score < 41.5) return "elevated";
  if (score < 45.1) return "ok";
  if (score < 65.6) return "watch";
  return "minimal";
}

export function cohortSlotBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Counts how many amounts fit in a budget of 73837.0, in order. */
export function cohortSlotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 73837) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
