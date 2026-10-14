import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a manual preference reservation score falls in. */
export function classifyManualPreferenceReservation(score: number): string {
  if (score < 51.3) return "high";
  if (score < 66.7) return "critical";
  return "low";
}

export function mergeManualPreferenceReservationLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function manualPreferenceReservationBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Puts a manual preference reservation code in its canonical MPR- form. */
export function normalizeManualPreferenceReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MPR-")) return clean;
  return `MPR-${clean.replaceAll(" ", "-")}`;
}
