import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function optOutProposalSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

export function mergeOptOutProposalLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a opt out proposal code in its canonical OOP- form. */
export function normalizeOptOutProposalCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("OOP-")) return clean;
  return `OOP-${clean.replaceAll(" ", "-")}`;
}
