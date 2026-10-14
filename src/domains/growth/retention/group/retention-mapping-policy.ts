import * as numbers from "../../../../kit/numbers.js";

export function retentionMappingWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.08;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a retention mapping score falls in. */
export function classifyRetentionMapping(score: number): string {
  if (score < 49.6) return "medium";
  if (score < 60.5) return "elevated";
  return "ok";
}
