import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a branch milestone score falls in. */
export function classifyBranchMilestone(score: number): string {
  if (score < 6.5) return "low";
  if (score < 68.8) return "high";
  if (score < 74) return "ok";
  if (score < 98.9) return "medium";
  return "watch";
}

export function branchMilestoneSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

export function mergeBranchMilestoneLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
