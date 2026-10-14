import * as numbers from "../../../../kit/numbers.js";

/** Names the band a weighted mention audit score falls in. */
export function classifyWeightedMentionAudit(score: number): string {
  if (score < 54.2) return "minimal";
  if (score < 56.4) return "medium";
  if (score < 79.5) return "critical";
  if (score < 83.1) return "high";
  return "watch";
}

export function weightedMentionAuditBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
