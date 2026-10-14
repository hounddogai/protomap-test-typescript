import * as numbers from "../../../../kit/numbers.js";

export function retentionVarianceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.69;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a retention variance score falls in. */
export function classifyRetentionVariance(score: number): string {
  if (score < 17) return "elevated";
  if (score < 19.2) return "low";
  if (score < 21.3) return "medium";
  if (score < 79.3) return "ok";
  return "minimal";
}
