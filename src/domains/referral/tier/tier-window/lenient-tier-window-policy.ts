import * as numbers from "../../../../kit/numbers.js";

export function lenientTierWindowSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

export function lenientTierWindowWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.96;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a lenient tier window score falls in. */
export function classifyLenientTierWindow(score: number): string {
  if (score < 37.1) return "high";
  if (score < 49.6) return "watch";
  if (score < 51.6) return "elevated";
  return "low";
}
