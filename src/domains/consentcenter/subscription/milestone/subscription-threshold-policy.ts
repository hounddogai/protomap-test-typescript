import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 99157.0, in order. */
export function subscriptionThresholdBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 99157) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function subscriptionThresholdWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.65;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function subscriptionThresholdBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
