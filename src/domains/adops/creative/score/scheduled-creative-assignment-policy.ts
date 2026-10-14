import * as numbers from "../../../../kit/numbers.js";

export function scheduledCreativeAssignmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function scheduledCreativeAssignmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a scheduled creative assignment score falls in. */
export function classifyScheduledCreativeAssignment(score: number): string {
  if (score < 4.4) return "low";
  if (score < 58.6) return "watch";
  if (score < 85.6) return "critical";
  return "elevated";
}
