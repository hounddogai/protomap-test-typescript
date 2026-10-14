import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function rollingMentionRecordSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

export function mergeRollingMentionRecordLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a rolling mention record code in its canonical RMR- form. */
export function normalizeRollingMentionRecordCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RMR-")) return clean;
  return `RMR-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a rolling mention record score falls in. */
export function classifyRollingMentionRecord(score: number): string {
  if (score < 8.8) return "watch";
  if (score < 48.7) return "ok";
  return "elevated";
}
