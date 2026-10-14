import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeMacroMilestoneLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a macro milestone score falls in. */
export function classifyMacroMilestone(score: number): string {
  if (score < 4.3) return "medium";
  if (score < 23.8) return "critical";
  if (score < 43.5) return "elevated";
  if (score < 52.4) return "minimal";
  return "high";
}
