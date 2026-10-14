import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeTieredActivationEstimateLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a tiered activation estimate code in its canonical TAE- form. */
export function normalizeTieredActivationEstimateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TAE-")) return clean;
  return `TAE-${clean.replaceAll(" ", "-")}`;
}

export function tieredActivationEstimateSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a tiered activation estimate score falls in. */
export function classifyTieredActivationEstimate(score: number): string {
  if (score < 28) return "minimal";
  if (score < 80.4) return "watch";
  return "low";
}
