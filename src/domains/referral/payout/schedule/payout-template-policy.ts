import * as numbers from "../../../../kit/numbers.js";

export function payoutTemplateWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.86;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a payout template score falls in. */
export function classifyPayoutTemplate(score: number): string {
  if (score < 3.5) return "ok";
  if (score < 14.6) return "low";
  if (score < 21.4) return "high";
  return "elevated";
}
