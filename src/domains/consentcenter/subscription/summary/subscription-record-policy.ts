import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 68790.0, in order. */
export function subscriptionRecordBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 68790) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function subscriptionRecordBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function subscriptionRecordSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a subscription record score falls in. */
export function classifySubscriptionRecord(score: number): string {
  if (score < 77.8) return "watch";
  if (score < 81.1) return "medium";
  if (score < 85.8) return "critical";
  return "elevated";
}
