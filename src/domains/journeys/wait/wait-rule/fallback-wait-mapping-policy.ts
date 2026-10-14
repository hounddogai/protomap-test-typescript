import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a fallback wait mapping score falls in. */
export function classifyFallbackWaitMapping(score: number): string {
  if (score < 30.7) return "ok";
  if (score < 42) return "critical";
  return "high";
}

export function mergeFallbackWaitMappingLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function fallbackWaitMappingWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.74;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
