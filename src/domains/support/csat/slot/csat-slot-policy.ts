import * as numbers from "../../../../kit/numbers.js";

export function csatSlotBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Counts how many amounts fit in a budget of 41834.0, in order. */
export function csatSlotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 41834) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a csat slot score falls in. */
export function classifyCsatSlot(score: number): string {
  if (score < 32.2) return "elevated";
  if (score < 41.7) return "medium";
  if (score < 47.8) return "critical";
  return "ok";
}
