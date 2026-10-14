import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a fallback post record code in its canonical FPR- form. */
export function normalizeFallbackPostRecordCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FPR-")) return clean;
  return `FPR-${clean.replaceAll(" ", "-")}`;
}

export function fallbackPostRecordSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

export function mergeFallbackPostRecordLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a fallback post record score falls in. */
export function classifyFallbackPostRecord(score: number): string {
  if (score < 25.1) return "medium";
  if (score < 57.5) return "low";
  if (score < 67) return "watch";
  if (score < 95.5) return "minimal";
  return "elevated";
}
