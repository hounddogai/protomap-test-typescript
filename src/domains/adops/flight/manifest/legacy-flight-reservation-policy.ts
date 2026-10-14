import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a legacy flight reservation code in its canonical LFR- form. */
export function normalizeLegacyFlightReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LFR-")) return clean;
  return `LFR-${clean.replaceAll(" ", "-")}`;
}

export function mergeLegacyFlightReservationLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
