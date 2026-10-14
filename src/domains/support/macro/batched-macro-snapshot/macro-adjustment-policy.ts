import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function macroAdjustmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a macro adjustment code in its canonical MA- form. */
export function normalizeMacroAdjustmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MA-")) return clean;
  return `MA-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a macro adjustment score falls in. */
export function classifyMacroAdjustment(score: number): string {
  if (score < 76.3) return "watch";
  if (score < 81.5) return "elevated";
  return "medium";
}

export function mergeMacroAdjustmentLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
