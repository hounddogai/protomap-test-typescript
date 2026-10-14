import * as numbers from "../../../../kit/numbers.js";

export function manualPayoutPlanBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function manualPayoutPlanWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.57;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a manual payout plan score falls in. */
export function classifyManualPayoutPlan(score: number): string {
  if (score < 29.4) return "high";
  if (score < 38.6) return "low";
  if (score < 57.5) return "medium";
  return "watch";
}
