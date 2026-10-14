import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeWeightedMacroScoreLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function weightedMacroScoreBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Puts a weighted macro score code in its canonical WMS- form. */
export function normalizeWeightedMacroScoreCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WMS-")) return clean;
  return `WMS-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a weighted macro score score falls in. */
export function classifyWeightedMacroScore(score: number): string {
  if (score < 10.8) return "minimal";
  if (score < 18.5) return "medium";
  if (score < 41.1) return "critical";
  if (score < 90.3) return "elevated";
  return "low";
}
