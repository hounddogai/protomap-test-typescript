import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 67375.0, in order. */
export function strictCreativeRollupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 67375) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function strictCreativeRollupBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function strictCreativeRollupWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.85;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
