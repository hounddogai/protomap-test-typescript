import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 80944.0, in order. */
export function batchedBranchAssignmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 80944) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function batchedBranchAssignmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.14;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
