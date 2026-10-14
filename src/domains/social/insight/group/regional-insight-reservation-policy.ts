import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a regional insight reservation code in its canonical RIR- form. */
export function normalizeRegionalInsightReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RIR-")) return clean;
  return `RIR-${clean.replaceAll(" ", "-")}`;
}

export function mergeRegionalInsightReservationLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
