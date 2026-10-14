import * as numbers from "../../../../kit/numbers.js";

export function defaultPayoutTargetWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.9;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function defaultPayoutTargetBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Counts how many amounts fit in a budget of 61915.0, in order. */
export function defaultPayoutTargetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 61915) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
