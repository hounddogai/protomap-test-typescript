import * as numbers from "../../../../kit/numbers.js";

export function rollingEnrollmentWindowBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function rollingEnrollmentWindowSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a rolling enrollment window score falls in. */
export function classifyRollingEnrollmentWindow(score: number): string {
  if (score < 23.2) return "high";
  if (score < 35.2) return "critical";
  if (score < 44.4) return "low";
  return "watch";
}
