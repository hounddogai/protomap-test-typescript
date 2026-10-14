import * as numbers from "../../../../kit/numbers.js";

export function adaptiveProofTierWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.98;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a adaptive proof tier score falls in. */
export function classifyAdaptiveProofTier(score: number): string {
  if (score < 3.3) return "low";
  if (score < 20.5) return "ok";
  if (score < 38.1) return "high";
  if (score < 43.7) return "medium";
  return "minimal";
}
