import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 80720.0, in order. */
export function scheduledTouchpointRecordBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 80720) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function scheduledTouchpointRecordWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.42;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
