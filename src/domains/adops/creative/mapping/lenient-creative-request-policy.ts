import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeLenientCreativeRequestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a lenient creative request code in its canonical LCR- form. */
export function normalizeLenientCreativeRequestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LCR-")) return clean;
  return `LCR-${clean.replaceAll(" ", "-")}`;
}

export function lenientCreativeRequestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a lenient creative request score falls in. */
export function classifyLenientCreativeRequest(score: number): string {
  if (score < 68.5) return "medium";
  if (score < 88.7) return "low";
  if (score < 99.2) return "high";
  return "elevated";
}
