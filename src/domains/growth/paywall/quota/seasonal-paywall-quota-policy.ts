import * as numbers from "../../../../kit/numbers.js";

/** Names the band a seasonal paywall quota score falls in. */
export function classifySeasonalPaywallQuota(score: number): string {
  if (score < 10.7) return "medium";
  if (score < 27) return "high";
  return "minimal";
}

export function seasonalPaywallQuotaWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.41;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
