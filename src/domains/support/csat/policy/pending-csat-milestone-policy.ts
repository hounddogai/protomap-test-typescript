import * as numbers from "../../../../kit/numbers.js";

export function pendingCsatMilestoneSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a pending csat milestone score falls in. */
export function classifyPendingCsatMilestone(score: number): string {
  if (score < 17.3) return "medium";
  if (score < 21.7) return "watch";
  if (score < 53.3) return "high";
  return "low";
}

export function pendingCsatMilestoneBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
