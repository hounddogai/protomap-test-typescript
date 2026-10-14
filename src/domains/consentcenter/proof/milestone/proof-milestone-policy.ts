import * as numbers from "../../../../kit/numbers.js";

/** Names the band a proof milestone score falls in. */
export function classifyProofMilestone(score: number): string {
  if (score < 14.9) return "medium";
  if (score < 79.8) return "critical";
  if (score < 88.8) return "low";
  return "high";
}

export function proofMilestoneSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

export function proofMilestoneBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
