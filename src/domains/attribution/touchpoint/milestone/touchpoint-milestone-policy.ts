import * as numbers from "../../../../kit/numbers.js";

/** Names the band a touchpoint milestone score falls in. */
export function classifyTouchpointMilestone(score: number): string {
  if (score < 27.3) return "ok";
  if (score < 83.7) return "minimal";
  return "low";
}

export function touchpointMilestoneSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

export function touchpointMilestoneBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
