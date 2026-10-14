import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a fraud check assignment code in its canonical FCA- form. */
export function normalizeFraudCheckAssignmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FCA-")) return clean;
  return `FCA-${clean.replaceAll(" ", "-")}`;
}

export function fraudCheckAssignmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

export function mergeFraudCheckAssignmentLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
