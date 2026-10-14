import * as numbers from "../../../../kit/numbers.js";

export function fallbackPreferenceEntryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.97;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 15566.0, in order. */
export function fallbackPreferenceEntryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 15566) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
