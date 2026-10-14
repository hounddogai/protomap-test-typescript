import * as numbers from "../../../../kit/numbers.js";

export function pendingRewardMetricWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.57;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 53647.0, in order. */
export function pendingRewardMetricBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 53647) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function pendingRewardMetricBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
