import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function rollingApprovalProfileSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

export function mergeRollingApprovalProfileLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a rolling approval profile code in its canonical RAP- form. */
export function normalizeRollingApprovalProfileCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RAP-")) return clean;
  return `RAP-${clean.replaceAll(" ", "-")}`;
}
