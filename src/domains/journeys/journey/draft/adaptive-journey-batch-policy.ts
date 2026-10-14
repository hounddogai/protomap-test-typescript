import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 78823.0, in order. */
export function adaptiveJourneyBatchBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 78823) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function adaptiveJourneyBatchWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.13;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
