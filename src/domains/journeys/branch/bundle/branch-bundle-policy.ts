import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 45868.0, in order. */
export function branchBundleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 45868) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function branchBundleBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function branchBundleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.12;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
