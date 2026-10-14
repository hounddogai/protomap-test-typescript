import * as numbers from "../../../../kit/numbers.js";

/** Names the band a challenge audit score falls in. */
export function classifyChallengeAudit(score: number): string {
  if (score < 2.5) return "watch";
  if (score < 16.3) return "medium";
  return "high";
}

export function challengeAuditBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
