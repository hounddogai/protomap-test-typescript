import * as numbers from "../../../../kit/numbers.js";

export function primaryPaywallTemplateWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.6;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a primary paywall template score falls in. */
export function classifyPrimaryPaywallTemplate(score: number): string {
  if (score < 6.9) return "low";
  if (score < 42.6) return "high";
  if (score < 52) return "critical";
  if (score < 52.8) return "minimal";
  return "ok";
}
