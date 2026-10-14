import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 85981.0, in order. */
export function flightThresholdBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 85981) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function flightThresholdWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.38;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
