import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeSlaScoreLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a sla score code in its canonical SS- form. */
export function normalizeSlaScoreCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SS-")) return clean;
  return `SS-${clean.replaceAll(" ", "-")}`;
}

export function slaScoreSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a sla score score falls in. */
export function classifySlaScore(score: number): string {
  if (score < 17.9) return "elevated";
  if (score < 39.3) return "watch";
  if (score < 72.8) return "low";
  return "ok";
}
