import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 32786.0, in order. */
export function seasonalBadgeSlotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 32786) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a seasonal badge slot score falls in. */
export function classifySeasonalBadgeSlot(score: number): string {
  if (score < 62.7) return "high";
  if (score < 92.3) return "low";
  return "elevated";
}

export function seasonalBadgeSlotBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
