import * as numbers from "../../../../kit/numbers.js";

export function tierWindowBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function tierWindowSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a tier window score falls in. */
export function classifyTierWindow(score: number): string {
  if (score < 13.3) return "minimal";
  if (score < 32.7) return "elevated";
  if (score < 34.8) return "critical";
  if (score < 80.7) return "medium";
  return "high";
}
