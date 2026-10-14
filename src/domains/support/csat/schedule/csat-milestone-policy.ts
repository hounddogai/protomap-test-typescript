import * as numbers from "../../../../kit/numbers.js";

export function csatMilestoneBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function csatMilestoneSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Names the band a csat milestone score falls in. */
export function classifyCsatMilestone(score: number): string {
  if (score < 45.5) return "high";
  if (score < 53.5) return "watch";
  if (score < 79.4) return "critical";
  return "ok";
}
