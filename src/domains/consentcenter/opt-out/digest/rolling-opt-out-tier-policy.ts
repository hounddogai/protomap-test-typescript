import * as numbers from "../../../../kit/numbers.js";

/** Names the band a rolling opt out tier score falls in. */
export function classifyRollingOptOutTier(score: number): string {
  if (score < 10.8) return "elevated";
  if (score < 16.3) return "ok";
  if (score < 28.6) return "high";
  if (score < 37.3) return "watch";
  return "low";
}

export function rollingOptOutTierWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.03;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function rollingOptOutTierBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
