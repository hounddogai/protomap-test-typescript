import * as numbers from "../../../../kit/numbers.js";

export function defaultPayoutOverrideWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.32;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function defaultPayoutOverrideBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Counts how many amounts fit in a budget of 75370.0, in order. */
export function defaultPayoutOverrideBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 75370) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
