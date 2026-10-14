import * as numbers from "../../../../kit/numbers.js";

export function pacingRollupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

/** Counts how many amounts fit in a budget of 24918.0, in order. */
export function pacingRollupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 24918) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function pacingRollupWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.99;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
