import * as numbers from "../../../../kit/numbers.js";

/** Names the band a seasonal wait tier score falls in. */
export function classifySeasonalWaitTier(score: number): string {
  if (score < 4.6) return "elevated";
  if (score < 13.1) return "minimal";
  return "watch";
}

export function seasonalWaitTierWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.85;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function seasonalWaitTierSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}
