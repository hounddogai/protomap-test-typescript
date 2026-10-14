import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function lenientExitRuleBudgetSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

export function mergeLenientExitRuleBudgetLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a lenient exit rule budget code in its canonical LERB- form. */
export function normalizeLenientExitRuleBudgetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LERB-")) return clean;
  return `LERB-${clean.replaceAll(" ", "-")}`;
}
