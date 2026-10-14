import * as numbers from "../../../../kit/numbers.js";

export function badgePreferenceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

export function badgePreferenceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.82;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 80655.0, in order. */
export function badgePreferenceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 80655) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
