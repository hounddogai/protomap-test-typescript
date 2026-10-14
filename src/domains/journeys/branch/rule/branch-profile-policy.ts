import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function branchProfileSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

export function mergeBranchProfileLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a branch profile score falls in. */
export function classifyBranchProfile(score: number): string {
  if (score < 15.5) return "watch";
  if (score < 76.2) return "elevated";
  if (score < 77.6) return "medium";
  return "critical";
}
