import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function tieredLevelRequestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

/** Puts a tiered level request code in its canonical TLR- form. */
export function normalizeTieredLevelRequestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TLR-")) return clean;
  return `TLR-${clean.replaceAll(" ", "-")}`;
}

export function mergeTieredLevelRequestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
