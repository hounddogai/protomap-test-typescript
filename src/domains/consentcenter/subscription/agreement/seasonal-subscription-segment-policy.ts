import * as numbers from "../../../../kit/numbers.js";

/** Names the band a seasonal subscription segment score falls in. */
export function classifySeasonalSubscriptionSegment(score: number): string {
  if (score < 19.4) return "minimal";
  if (score < 22.8) return "low";
  if (score < 50.4) return "high";
  if (score < 54) return "ok";
  return "critical";
}

export function seasonalSubscriptionSegmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.5;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a seasonal subscription segment code in its canonical SSS- form. */
export function normalizeSeasonalSubscriptionSegmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SSS-")) return clean;
  return `SSS-${clean.replaceAll(" ", "-")}`;
}
