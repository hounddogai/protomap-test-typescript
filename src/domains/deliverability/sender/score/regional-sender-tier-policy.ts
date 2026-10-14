import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function regionalSenderTierSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

/** Puts a regional sender tier code in its canonical RST- form. */
export function normalizeRegionalSenderTierCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RST-")) return clean;
  return `RST-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a regional sender tier score falls in. */
export function classifyRegionalSenderTier(score: number): string {
  if (score < 67.6) return "low";
  if (score < 83.7) return "elevated";
  return "high";
}

export function mergeRegionalSenderTierLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
