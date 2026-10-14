import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a preference entry score falls in. */
export function classifyPreferenceEntry(score: number): string {
  if (score < 44.7) return "ok";
  if (score < 48.3) return "critical";
  if (score < 61.3) return "low";
  if (score < 99.4) return "high";
  return "elevated";
}

export function preferenceEntryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.22;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergePreferenceEntryLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
