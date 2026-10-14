import * as numbers from "../../../../kit/numbers.js";

export function preferenceWindowWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.79;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function preferenceWindowSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

/** Counts how many amounts fit in a budget of 14121.0, in order. */
export function preferenceWindowBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 14121) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
