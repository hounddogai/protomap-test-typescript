import * as numbers from "../../../../kit/numbers.js";

export function lenientDeflectionSegmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

export function lenientDeflectionSegmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Names the band a lenient deflection segment score falls in. */
export function classifyLenientDeflectionSegment(score: number): string {
  if (score < 23.2) return "minimal";
  if (score < 46.7) return "critical";
  if (score < 78.3) return "medium";
  if (score < 84.5) return "low";
  return "elevated";
}
