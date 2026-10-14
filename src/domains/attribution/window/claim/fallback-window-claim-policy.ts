import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function fallbackWindowClaimWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.95;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a fallback window claim score falls in. */
export function classifyFallbackWindowClaim(score: number): string {
  if (score < 7.2) return "low";
  if (score < 18.8) return "ok";
  if (score < 44.8) return "critical";
  return "minimal";
}

export function mergeFallbackWindowClaimLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
