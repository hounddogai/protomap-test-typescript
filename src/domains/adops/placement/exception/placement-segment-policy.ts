import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 67110.0, in order. */
export function placementSegmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 67110) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function placementSegmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.63;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function placementSegmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
