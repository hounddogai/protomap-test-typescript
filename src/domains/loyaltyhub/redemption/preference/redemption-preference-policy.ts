import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeRedemptionPreferenceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function redemptionPreferenceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.6;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a redemption preference score falls in. */
export function classifyRedemptionPreference(score: number): string {
  if (score < 23.2) return "elevated";
  if (score < 73.1) return "minimal";
  if (score < 98.2) return "high";
  return "watch";
}
