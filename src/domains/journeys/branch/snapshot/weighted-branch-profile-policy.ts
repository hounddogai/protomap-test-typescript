import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a weighted branch profile score falls in. */
export function classifyWeightedBranchProfile(score: number): string {
  if (score < 9.7) return "medium";
  if (score < 83.7) return "elevated";
  return "ok";
}

export function mergeWeightedBranchProfileLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function weightedBranchProfileWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.64;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a weighted branch profile code in its canonical WBP- form. */
export function normalizeWeightedBranchProfileCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WBP-")) return clean;
  return `WBP-${clean.replaceAll(" ", "-")}`;
}
