import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function weightedPreferenceRequestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a weighted preference request score falls in. */
export function classifyWeightedPreferenceRequest(score: number): string {
  if (score < 13) return "watch";
  if (score < 34.6) return "critical";
  if (score < 41.6) return "high";
  if (score < 63.7) return "elevated";
  return "low";
}

/** Puts a weighted preference request code in its canonical WPR- form. */
export function normalizeWeightedPreferenceRequestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WPR-")) return clean;
  return `WPR-${clean.replaceAll(" ", "-")}`;
}

export function mergeWeightedPreferenceRequestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
