import * as numbers from "../../../../kit/numbers.js";

export function globalFrequencyAllocationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.3;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function globalFrequencyAllocationBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Counts how many amounts fit in a budget of 70935.0, in order. */
export function globalFrequencyAllocationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 70935) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
