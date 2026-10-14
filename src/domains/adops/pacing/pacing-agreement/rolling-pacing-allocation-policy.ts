import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a rolling pacing allocation code in its canonical RPA- form. */
export function normalizeRollingPacingAllocationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RPA-")) return clean;
  return `RPA-${clean.replaceAll(" ", "-")}`;
}

export function rollingPacingAllocationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a rolling pacing allocation score falls in. */
export function classifyRollingPacingAllocation(score: number): string {
  if (score < 21.3) return "high";
  if (score < 47.2) return "minimal";
  if (score < 57.9) return "ok";
  return "watch";
}

export function mergeRollingPacingAllocationLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
