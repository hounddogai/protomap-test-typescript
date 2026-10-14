import * as numbers from "../../../../kit/numbers.js";

/** Names the band a tiered invite record score falls in. */
export function classifyTieredInviteRecord(score: number): string {
  if (score < 19.1) return "ok";
  if (score < 30.7) return "watch";
  if (score < 33.4) return "high";
  return "elevated";
}

export function tieredInviteRecordWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.53;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
