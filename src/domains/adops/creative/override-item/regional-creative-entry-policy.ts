import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function regionalCreativeEntrySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a regional creative entry score falls in. */
export function classifyRegionalCreativeEntry(score: number): string {
  if (score < 25.2) return "critical";
  if (score < 81) return "elevated";
  return "medium";
}

/** Puts a regional creative entry code in its canonical RCE- form. */
export function normalizeRegionalCreativeEntryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RCE-")) return clean;
  return `RCE-${clean.replaceAll(" ", "-")}`;
}

export function mergeRegionalCreativeEntryLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
