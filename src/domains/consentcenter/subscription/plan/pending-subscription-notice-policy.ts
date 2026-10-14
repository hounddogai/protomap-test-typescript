import * as numbers from "../../../../kit/numbers.js";

export function pendingSubscriptionNoticeSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

export function pendingSubscriptionNoticeWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.7;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 4841.0, in order. */
export function pendingSubscriptionNoticeBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 4841) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
