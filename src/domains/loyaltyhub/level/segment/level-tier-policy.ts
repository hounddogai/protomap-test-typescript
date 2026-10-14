import * as numbers from "../../../../kit/numbers.js";

export function levelTierWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.29;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a level tier score falls in. */
export function classifyLevelTier(score: number): string {
  if (score < 14.7) return "low";
  if (score < 16.7) return "minimal";
  if (score < 95.7) return "elevated";
  return "medium";
}

export function levelTierBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
