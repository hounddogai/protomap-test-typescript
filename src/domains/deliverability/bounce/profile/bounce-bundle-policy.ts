import * as numbers from "../../../../kit/numbers.js";

export function bounceBundleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

export function bounceBundleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.22;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a bounce bundle score falls in. */
export function classifyBounceBundle(score: number): string {
  if (score < 5.2) return "critical";
  if (score < 26.7) return "medium";
  if (score < 59.3) return "minimal";
  if (score < 99.2) return "high";
  return "low";
}

/** Counts how many amounts fit in a budget of 94466.0, in order. */
export function bounceBundleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 94466) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
