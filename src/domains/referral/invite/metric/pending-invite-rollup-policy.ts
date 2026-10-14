import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergePendingInviteRollupLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function pendingInviteRollupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a pending invite rollup code in its canonical PIR- form. */
export function normalizePendingInviteRollupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PIR-")) return clean;
  return `PIR-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a pending invite rollup score falls in. */
export function classifyPendingInviteRollup(score: number): string {
  if (score < 13) return "low";
  if (score < 21.8) return "medium";
  if (score < 38.7) return "high";
  if (score < 49.3) return "elevated";
  return "watch";
}
