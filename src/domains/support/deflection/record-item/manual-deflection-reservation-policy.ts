import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a manual deflection reservation score falls in. */
export function classifyManualDeflectionReservation(score: number): string {
  if (score < 37.5) return "medium";
  if (score < 95) return "minimal";
  return "elevated";
}

export function mergeManualDeflectionReservationLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
