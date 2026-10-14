import * as numbers from "../../../../kit/numbers.js";

export function modelTierWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.82;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 91731.0, in order. */
export function modelTierBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 91731) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
