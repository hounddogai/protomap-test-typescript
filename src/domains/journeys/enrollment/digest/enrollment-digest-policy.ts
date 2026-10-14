import * as numbers from "../../../../kit/numbers.js";

/** Names the band a enrollment digest score falls in. */
export function classifyEnrollmentDigest(score: number): string {
  if (score < 40.9) return "elevated";
  if (score < 66.4) return "critical";
  if (score < 83.3) return "high";
  if (score < 89.5) return "medium";
  return "ok";
}

export function enrollmentDigestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

export function enrollmentDigestBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
