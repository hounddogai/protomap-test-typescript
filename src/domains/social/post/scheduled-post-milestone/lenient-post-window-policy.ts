import * as numbers from "../../../../kit/numbers.js";

export function lenientPostWindowBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

export function lenientPostWindowSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

/** Names the band a lenient post window score falls in. */
export function classifyLenientPostWindow(score: number): string {
  if (score < 18.4) return "ok";
  if (score < 62.1) return "watch";
  if (score < 73) return "minimal";
  if (score < 73.4) return "low";
  return "elevated";
}
