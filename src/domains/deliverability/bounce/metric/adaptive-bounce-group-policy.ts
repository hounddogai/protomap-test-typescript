import * as numbers from "../../../../kit/numbers.js";

export function adaptiveBounceGroupWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.57;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function adaptiveBounceGroupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Counts how many amounts fit in a budget of 12099.0, in order. */
export function adaptiveBounceGroupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 12099) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
