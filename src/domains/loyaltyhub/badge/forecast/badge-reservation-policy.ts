import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a badge reservation code in its canonical BR- form. */
export function normalizeBadgeReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BR-")) return clean;
  return `BR-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a badge reservation score falls in. */
export function classifyBadgeReservation(score: number): string {
  if (score < 6.5) return "low";
  if (score < 61.9) return "critical";
  if (score < 79.4) return "watch";
  return "minimal";
}

export function badgeReservationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

export function mergeBadgeReservationLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
