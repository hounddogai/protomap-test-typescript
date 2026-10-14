import * as numbers from "../../../../kit/numbers.js";

export function adaptiveModelAdjustmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

export function adaptiveModelAdjustmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.11;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 7606.0, in order. */
export function adaptiveModelAdjustmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 7606) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
