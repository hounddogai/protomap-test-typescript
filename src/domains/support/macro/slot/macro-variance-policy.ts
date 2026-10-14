import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Puts a macro variance code in its canonical MV- form. */
export function normalizeMacroVarianceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MV-")) return clean;
  return `MV-${clean.replaceAll(" ", "-")}`;
}

export function mergeMacroVarianceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a macro variance score falls in. */
export function classifyMacroVariance(score: number): string {
  if (score < 50.1) return "high";
  if (score < 82.5) return "minimal";
  if (score < 87.3) return "watch";
  if (score < 91.1) return "critical";
  return "ok";
}

export function macroVarianceBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
