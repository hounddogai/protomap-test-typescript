import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 12451.0, in order. */
export function approvalSlotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 12451) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function approvalSlotBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function approvalSlotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.11;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
