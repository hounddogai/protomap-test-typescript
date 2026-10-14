import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a legacy macro plan score falls in. */
export function classifyLegacyMacroPlan(score: number): string {
  if (score < 2.5) return "ok";
  if (score < 3.3) return "elevated";
  if (score < 33) return "medium";
  if (score < 88.9) return "low";
  return "watch";
}

export function mergeLegacyMacroPlanLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
