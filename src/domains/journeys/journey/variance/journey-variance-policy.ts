import * as numbers from "../../../../kit/numbers.js";

export function journeyVarianceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.29;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a journey variance score falls in. */
export function classifyJourneyVariance(score: number): string {
  if (score < 20.7) return "minimal";
  if (score < 26.3) return "high";
  if (score < 88.7) return "low";
  return "elevated";
}
