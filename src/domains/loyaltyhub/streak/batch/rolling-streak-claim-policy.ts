import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a rolling streak claim code in its canonical RSC- form. */
export function normalizeRollingStreakClaimCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RSC-")) return clean;
  return `RSC-${clean.replaceAll(" ", "-")}`;
}

export function rollingStreakClaimSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a rolling streak claim score falls in. */
export function classifyRollingStreakClaim(score: number): string {
  if (score < 5.4) return "medium";
  if (score < 57.6) return "minimal";
  if (score < 62.4) return "ok";
  return "watch";
}

export function mergeRollingStreakClaimLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
