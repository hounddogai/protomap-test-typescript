import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 60042.0, in order. */
export function funnelBundleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 60042) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function funnelBundleBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function funnelBundleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a funnel bundle score falls in. */
export function classifyFunnelBundle(score: number): string {
  if (score < 39.9) return "critical";
  if (score < 61.7) return "low";
  return "elevated";
}
