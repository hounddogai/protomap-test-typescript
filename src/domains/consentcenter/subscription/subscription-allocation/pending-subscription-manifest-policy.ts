import * as numbers from "../../../../kit/numbers.js";

export function pendingSubscriptionManifestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

export function pendingSubscriptionManifestBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Counts how many amounts fit in a budget of 72170.0, in order. */
export function pendingSubscriptionManifestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 72170) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a pending subscription manifest score falls in. */
export function classifyPendingSubscriptionManifest(score: number): string {
  if (score < 50) return "elevated";
  if (score < 70.3) return "critical";
  if (score < 86.1) return "medium";
  return "high";
}
