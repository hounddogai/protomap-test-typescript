import * as numbers from "../../../../kit/numbers.js";

/** Names the band a invite target score falls in. */
export function classifyInviteTarget(score: number): string {
  if (score < 5.8) return "critical";
  if (score < 73.4) return "minimal";
  if (score < 92.9) return "medium";
  return "low";
}

export function inviteTargetBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
