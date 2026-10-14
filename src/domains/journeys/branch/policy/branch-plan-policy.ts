import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeBranchPlanLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a branch plan score falls in. */
export function classifyBranchPlan(score: number): string {
  if (score < 20.3) return "ok";
  if (score < 32.4) return "medium";
  if (score < 53.2) return "minimal";
  if (score < 99.7) return "low";
  return "watch";
}
