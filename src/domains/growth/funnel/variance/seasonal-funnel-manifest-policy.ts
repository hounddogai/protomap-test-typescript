import * as numbers from "../../../../kit/numbers.js";

export function seasonalFunnelManifestBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a seasonal funnel manifest score falls in. */
export function classifySeasonalFunnelManifest(score: number): string {
  if (score < 22.6) return "critical";
  if (score < 85) return "watch";
  if (score < 98.8) return "medium";
  return "high";
}

/** Counts how many amounts fit in a budget of 11869.0, in order. */
export function seasonalFunnelManifestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 11869) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function seasonalFunnelManifestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}
