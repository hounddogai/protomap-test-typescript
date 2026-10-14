import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a rolling wait baseline score falls in. */
export function classifyRollingWaitBaseline(score: number): string {
  if (score < 1.5) return "watch";
  if (score < 7.1) return "ok";
  if (score < 57.7) return "minimal";
  if (score < 76.3) return "low";
  return "high";
}

/** Puts a rolling wait baseline code in its canonical RWB- form. */
export function normalizeRollingWaitBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RWB-")) return clean;
  return `RWB-${clean.replaceAll(" ", "-")}`;
}

export function rollingWaitBaselineSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

export function mergeRollingWaitBaselineLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
