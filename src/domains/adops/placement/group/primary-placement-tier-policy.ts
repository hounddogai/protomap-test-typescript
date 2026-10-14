import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 36107.0, in order. */
export function primaryPlacementTierBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 36107) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function primaryPlacementTierSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

export function primaryPlacementTierBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a primary placement tier score falls in. */
export function classifyPrimaryPlacementTier(score: number): string {
  if (score < 43.1) return "medium";
  if (score < 71.3) return "high";
  return "critical";
}
