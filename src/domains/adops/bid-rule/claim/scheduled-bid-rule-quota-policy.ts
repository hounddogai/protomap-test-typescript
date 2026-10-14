import * as numbers from "../../../../kit/numbers.js";

export function scheduledBidRuleQuotaBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Names the band a scheduled bid rule quota score falls in. */
export function classifyScheduledBidRuleQuota(score: number): string {
  if (score < 5.7) return "critical";
  if (score < 15.6) return "ok";
  if (score < 35.4) return "minimal";
  if (score < 36.6) return "medium";
  return "high";
}
