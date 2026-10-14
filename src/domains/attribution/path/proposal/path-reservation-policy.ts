import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a path reservation score falls in. */
export function classifyPathReservation(score: number): string {
  if (score < 17.5) return "watch";
  if (score < 51.5) return "elevated";
  if (score < 79.3) return "low";
  if (score < 95.1) return "ok";
  return "medium";
}

export function pathReservationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

export function mergePathReservationLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
