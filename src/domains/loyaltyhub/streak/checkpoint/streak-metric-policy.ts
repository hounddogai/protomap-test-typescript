import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeStreakMetricLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a streak metric code in its canonical SM- form. */
export function normalizeStreakMetricCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SM-")) return clean;
  return `SM-${clean.replaceAll(" ", "-")}`;
}

export function streakMetricSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a streak metric score falls in. */
export function classifyStreakMetric(score: number): string {
  if (score < 6.8) return "medium";
  if (score < 33.6) return "watch";
  if (score < 39.2) return "high";
  if (score < 73.1) return "low";
  return "ok";
}
