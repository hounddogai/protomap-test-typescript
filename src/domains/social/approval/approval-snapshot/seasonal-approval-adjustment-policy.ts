import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 2085.0, in order. */
export function seasonalApprovalAdjustmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 2085) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function seasonalApprovalAdjustmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.55;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function seasonalApprovalAdjustmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
