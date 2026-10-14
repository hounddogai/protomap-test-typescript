import * as numbers from "../../../../kit/numbers.js";

export function manualSubscriptionSnapshotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 3091.0, in order. */
export function manualSubscriptionSnapshotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 3091) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function manualSubscriptionSnapshotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.62;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
