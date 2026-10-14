import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a weighted wait profile score falls in. */
export function classifyWeightedWaitProfile(score: number): string {
  if (score < 45.8) return "low";
  if (score < 51.5) return "watch";
  if (score < 87.7) return "ok";
  return "medium";
}

/** Puts a weighted wait profile code in its canonical WWP- form. */
export function normalizeWeightedWaitProfileCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WWP-")) return clean;
  return `WWP-${clean.replaceAll(" ", "-")}`;
}

export function mergeWeightedWaitProfileLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function weightedWaitProfileSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}
