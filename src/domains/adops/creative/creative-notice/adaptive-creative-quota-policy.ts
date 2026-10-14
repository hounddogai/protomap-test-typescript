import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 55683.0, in order. */
export function adaptiveCreativeQuotaBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 55683) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function adaptiveCreativeQuotaWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.73;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
