import * as numbers from "../../../../kit/numbers.js";

export function paywallAssignmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.81;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 96459.0, in order. */
export function paywallAssignmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 96459) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
