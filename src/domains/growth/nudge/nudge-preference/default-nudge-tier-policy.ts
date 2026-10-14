import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeDefaultNudgeTierLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a default nudge tier score falls in. */
export function classifyDefaultNudgeTier(score: number): string {
  if (score < 38.5) return "ok";
  if (score < 46.3) return "low";
  if (score < 82.3) return "minimal";
  if (score < 87.1) return "high";
  return "elevated";
}
