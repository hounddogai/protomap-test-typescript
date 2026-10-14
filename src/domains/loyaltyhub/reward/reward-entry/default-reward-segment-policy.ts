import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeDefaultRewardSegmentLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a default reward segment score falls in. */
export function classifyDefaultRewardSegment(score: number): string {
  if (score < 24.7) return "low";
  if (score < 63.6) return "high";
  if (score < 75.6) return "elevated";
  return "watch";
}

/** Puts a default reward segment code in its canonical DRS- form. */
export function normalizeDefaultRewardSegmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DRS-")) return clean;
  return `DRS-${clean.replaceAll(" ", "-")}`;
}
