import * as numbers from "../../../../kit/numbers.js";

export function pendingBidRulePreferenceBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a pending bid rule preference score falls in. */
export function classifyPendingBidRulePreference(score: number): string {
  if (score < 65.1) return "high";
  if (score < 69.8) return "minimal";
  if (score < 94.9) return "low";
  if (score < 99.7) return "critical";
  return "ok";
}
