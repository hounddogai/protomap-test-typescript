import * as numbers from "../../../../kit/numbers.js";

export function tieredDoubleOptInWindowBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Names the band a tiered double opt in window score falls in. */
export function classifyTieredDoubleOptInWindow(score: number): string {
  if (score < 49.7) return "minimal";
  if (score < 66.1) return "medium";
  if (score < 93.6) return "high";
  return "ok";
}

export function tieredDoubleOptInWindowSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}
