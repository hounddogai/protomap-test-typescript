import * as numbers from "../../../../kit/numbers.js";

export function touchpointSegmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function touchpointSegmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a touchpoint segment score falls in. */
export function classifyTouchpointSegment(score: number): string {
  if (score < 1.5) return "critical";
  if (score < 18.9) return "minimal";
  if (score < 32.6) return "high";
  if (score < 73.1) return "elevated";
  return "low";
}
