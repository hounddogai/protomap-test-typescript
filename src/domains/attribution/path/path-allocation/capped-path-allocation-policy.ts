import * as numbers from "../../../../kit/numbers.js";

export function cappedPathAllocationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.14;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 44627.0, in order. */
export function cappedPathAllocationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 44627) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
