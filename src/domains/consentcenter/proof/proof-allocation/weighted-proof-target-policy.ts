import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeWeightedProofTargetLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function weightedProofTargetSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

export function weightedProofTargetWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.56;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a weighted proof target code in its canonical WPT- form. */
export function normalizeWeightedProofTargetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WPT-")) return clean;
  return `WPT-${clean.replaceAll(" ", "-")}`;
}
