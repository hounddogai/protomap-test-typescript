import * as numbers from "../../../../kit/numbers.js";

/** Names the band a manual ticket view tier score falls in. */
export function classifyManualTicketViewTier(score: number): string {
  if (score < 6.6) return "elevated";
  if (score < 39.6) return "critical";
  if (score < 89.1) return "medium";
  if (score < 93.7) return "minimal";
  return "low";
}

export function manualTicketViewTierWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.14;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
