import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 13809.0, in order. */
export function tieredPlacementRollupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 13809) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function tieredPlacementRollupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

/** Names the band a tiered placement rollup score falls in. */
export function classifyTieredPlacementRollup(score: number): string {
  if (score < 55) return "low";
  if (score < 80) return "high";
  if (score < 86.2) return "elevated";
  return "minimal";
}

export function tieredPlacementRollupWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.95;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
