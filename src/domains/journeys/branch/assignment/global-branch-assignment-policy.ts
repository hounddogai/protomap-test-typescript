import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function globalBranchAssignmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

export function mergeGlobalBranchAssignmentLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a global branch assignment code in its canonical GBA- form. */
export function normalizeGlobalBranchAssignmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GBA-")) return clean;
  return `GBA-${clean.replaceAll(" ", "-")}`;
}
