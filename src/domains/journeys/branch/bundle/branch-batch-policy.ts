import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a branch batch score falls in. */
export function classifyBranchBatch(score: number): string {
  if (score < 44.2) return "high";
  if (score < 53.7) return "watch";
  if (score < 77.3) return "critical";
  return "minimal";
}

export function mergeBranchBatchLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function branchBatchSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Puts a branch batch code in its canonical BB- form. */
export function normalizeBranchBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BB-")) return clean;
  return `BB-${clean.replaceAll(" ", "-")}`;
}
