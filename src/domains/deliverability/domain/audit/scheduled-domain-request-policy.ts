import * as numbers from "../../../../kit/numbers.js";

export function scheduledDomainRequestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.82;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 38724.0, in order. */
export function scheduledDomainRequestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 38724) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function scheduledDomainRequestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}
